"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventEmitter = require("events");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const Module_1 = require("./Module");
const IEndpoint_1 = require("./IEndpoint");
const EndpointTypes_1 = require("./EndpointTypes");
const IrcEndpoint_1 = require("./endpoints/IrcEndpoint");
const TelegramEndpoint_1 = require("./endpoints/TelegramEndpoint");
const DiscordEndpoint_1 = require("./endpoints/DiscordEndpoint");
const Command_1 = require("./Command");
const ManagerConfig_1 = require("./config/ManagerConfig");
const ModuleConfig_1 = require("./config/ModuleConfig");
const TwitchEndpoint_1 = require("./endpoints/TwitchEndpoint");
const BotFrameworkEndpoint_1 = require("./endpoints/BotFrameworkEndpoint");
class Bot extends EventEmitter {
    constructor(config) {
        super();
        this.discriminator = "Bot";
        /*const*/ this.cmdStorage = "";
        this.txtCmdsDirty = false;
        this.config = config;
        this.modules = {};
        this.endpoints = {};
        this.textCommands = {};
        this.auth = new Map();
        this.authOptions = new Map();
        this.cmdStorage = path.join(this.config.storagePath, "botcmd.json");
        this.on(IEndpoint_1.EndpointEvents.Connected, (sender) => {
            console.log(sender.name, "OnConnected");
        });
        this.on(IEndpoint_1.EndpointEvents.UserLeave, (sender, msg) => {
            this.logoutUser(msg);
        });
        this.on(IEndpoint_1.EndpointEvents.NameChange, (sender, msg) => {
            let level = this.isUserAuthed(msg);
            if (level > 1) {
                this.auth.get(sender).delete(msg.from.name);
                this.auth.get(sender).set(msg.newName, level);
            }
        });
        // this.on(EndpointEvents.Message, this.onMessage);
    }
    async onMessage(sender, msg) {
        let parts = msg.message.split(" ");
        let cmdStr = parts[0].toLowerCase();
        // Cast our msg to ICommandMessage so we can add command specific argument info.
        let cmdMsg = msg;
        cmdMsg.args = parts.slice(1);
        if (parts.length > 1 && parts[0][0] == '@') { // IRC: @Name !command
            if (parts[0].toLowerCase() != '@' + msg.endpoint.me.account.toLowerCase() &&
                parts[0].toLowerCase() != '@' + msg.endpoint.me.name.toLowerCase()) {
                return;
            }
            cmdStr = parts[1].toLowerCase();
            cmdMsg.args = parts.slice(2);
        }
        else if (parts.length > 1 && parts[0][0] == '<') { // Discord: <@account> !command
            if (cmdStr != '<@' + msg.endpoint.me.account + '>') {
                return;
            }
            cmdStr = parts[1].toLowerCase();
            cmdMsg.args = parts.slice(2);
        }
        else if (parts.length > 1 && cmdStr == msg.endpoint.me.name.toLowerCase()) { // IRC: Name !command (no @ required)
            cmdStr = parts[1].toLowerCase();
            cmdMsg.args = parts.slice(2);
        }
        else if (parts.length > 0 && cmdStr.indexOf(msg.endpoint.me.name.toLowerCase()) === 0) { // Skype: Name!command
            if (cmdStr.indexOf(sender.config.commandPrefix) === -1) { // Probably: Name !command
                if (parts.length > 1) {
                    cmdStr = parts[1].toLowerCase();
                    cmdMsg.args = parts.slice(2);
                }
                else { // Maybe the bot's name is a command?
                }
            }
            else {
                // Check for Skype: Name!command
                if (cmdStr[msg.endpoint.me.name.length] != sender.config.commandPrefix) { // Likely: Name(something)! which is invalid pattern.
                    return;
                }
                cmdStr = parts[0].substr(msg.endpoint.me.name.length);
            }
        }
        else {
            let indx = parts[0].indexOf("@");
            if (indx >= 2 && cmdStr.substr(indx) == '@' + msg.endpoint.me.account.toLowerCase()) { // Telegram: /command@account
                cmdStr = cmdStr.substr(0, indx);
            }
        }
        cmdMsg.command = cmdStr;
        let cmd = this.textCommands[cmdStr];
        try {
            console.log("BOT1");
            if (cmd && !cmd.requireCommandPrefix) {
                await cmd.execute(this, cmdMsg);
            }
            else if (cmdStr[0] == sender.config.commandPrefix) {
                cmd = this.textCommands[cmdStr.substr(1)];
                if (cmd) {
                    await cmd.execute(this, cmdMsg);
                }
            }
            console.log("BOT2");
        }
        catch (er) {
            if (this.isUserAuthed(msg) >= 3) {
                sender.say(msg.from, "[Error] " + er);
            }
        }
    }
    init() {
        // Load the commands before other things in case they add commands during init/module load.
        let deser = JSON.parse(fs.readFileSync(this.cmdStorage).toString());
        let deserKeys = Object.keys(deser);
        deserKeys.forEach(p => deser[p] = Command_1.Command.Deserialize(deser[p]));
        this.textCommands = deser;
        for (let i = 0; i < this.config.endpoints.length; i++) {
            let ep = this.config.endpoints[i];
            let endpointKey = ep.name || ep.type.toString();
            let endpoint = null;
            if (this.endpoints[endpointKey]) {
                throw new Error("Duplicate endpoint: '" + endpointKey + "'. Specifying a unique name will resolve this.");
            }
            switch (ep.type) {
                case EndpointTypes_1.EndpointTypes.IRC:
                    endpoint = new IrcEndpoint_1.IrcEndpoint(ep, this);
                    break;
                case EndpointTypes_1.EndpointTypes.Telegram:
                    endpoint = new TelegramEndpoint_1.TelegramEndpoint(ep, this);
                    break;
                case EndpointTypes_1.EndpointTypes.Discord:
                    endpoint = new DiscordEndpoint_1.DiscordEndpoint(ep, this);
                    break;
                case EndpointTypes_1.EndpointTypes.Twitch:
                    endpoint = new TwitchEndpoint_1.TwitchEndpoint(ep, this);
                    break;
                case EndpointTypes_1.EndpointTypes.BotFramework:
                    endpoint = new BotFrameworkEndpoint_1.BotFrameworkEndpoint(ep, this);
                    break;
                default:
                    throw new Error("Missing endpoint type: " + ep.type.toString());
            }
            this.endpoints[endpointKey] = endpoint;
            if (ep.modules) {
                for (let name of ep.modules) {
                    if (typeof name == "string") {
                        this.loadModule(name, null, endpointKey);
                    }
                    else {
                        this.loadModule(name.file, name.options, endpointKey);
                    }
                }
            }
            this.authOptions.set(endpoint, ep.managers.map(p => new Manager(p)));
            this.auth.set(endpoint, new Map());
        }
        // Some modules may require certain endpoints for init.
        if (this.config.modules) {
            for (let i = 0; i < this.config.modules.length; i++) {
                let mod = this.config.modules[i];
                if (typeof mod == "string") {
                    this.loadModule(mod);
                }
                else {
                    this.loadModule(mod.file, mod.options);
                }
            }
        }
        // Wait for each endpoint to be created before connecting
        let keys = Object.keys(this.endpoints);
        for (let key in keys) {
            if (this.endpoints.hasOwnProperty(keys[key])) {
                this.endpoints[keys[key]].on(IEndpoint_1.EndpointEvents.Connected.toString(), (...args) => {
                    args.unshift(IEndpoint_1.EndpointEvents.Connected.toString());
                    this.emit.apply(this, args);
                });
                this.endpoints[keys[key]].on(IEndpoint_1.EndpointEvents.NewChannel.toString(), (...args) => {
                    args.unshift(IEndpoint_1.EndpointEvents.NewChannel.toString());
                    this.emit.apply(this, args);
                });
                this.endpoints[keys[key]].on(IEndpoint_1.EndpointEvents.UserJoin.toString(), (...args) => {
                    args.unshift(IEndpoint_1.EndpointEvents.UserJoin.toString());
                    this.emit.apply(this, args);
                });
                this.endpoints[keys[key]].on(IEndpoint_1.EndpointEvents.UserLeave.toString(), (...args) => {
                    args.unshift(IEndpoint_1.EndpointEvents.UserLeave.toString());
                    this.emit.apply(this, args);
                });
                this.endpoints[keys[key]].on(IEndpoint_1.EndpointEvents.NameChange.toString(), (...args) => {
                    args.unshift(IEndpoint_1.EndpointEvents.NameChange.toString());
                    this.emit.apply(this, args);
                });
                this.endpoints[keys[key]].on(IEndpoint_1.EndpointEvents.Disconnected.toString(), (...args) => {
                    args.unshift(IEndpoint_1.EndpointEvents.Disconnected.toString());
                    this.emit.apply(this, args);
                });
                this.endpoints[keys[key]].on(IEndpoint_1.EndpointEvents.Message.toString(), (...args) => {
                    args.unshift(IEndpoint_1.EndpointEvents.Message.toString());
                    this.emit.apply(this, args);
                });
                this.endpoints[keys[key]].connect();
            }
        }
    }
    loadModule(module, cfg = null, endpoint = null) {
        console.log("LOAD MODULE", module, endpoint);
        if (this.modules[module]) {
            this.unloadModule(module);
            let keys = Object.keys(require.cache);
            let filename = path.basename(module);
            for (let key of keys) {
                if (key.indexOf(filename) > 0) {
                    delete require.cache[key];
                    break;
                }
            }
        }
        let mod = null;
        try {
            mod = require(module);
        }
        catch (ex) {
            if (ex.message.indexOf("Cannot find module") >= 0) {
                mod = require('../modules/' + module);
            }
            else {
                throw ex;
            }
        }
        if (!mod.create)
            throw new Error("Module missing create");
        mod = mod.create(Module_1.Module);
        if (!mod.init)
            throw new Error("Created module missing init");
        if (!endpoint && this.config.modules.filter(p => (typeof p == "string" && p == module) || p.file == module).length == 0) {
            let m = module;
            if (cfg) {
                m = new ModuleConfig_1.ModuleConfig();
                m.options = cfg;
                m.file = module;
            }
            this.config.modules.push(m);
        }
        else if (endpoint) {
            let ep = this.config.endpoints.filter(p => p.name == endpoint);
            if (ep.length > 0 && ep[0].
                modules.filter(p => (typeof p == "string" && p == module) || p.file == module).length == 0) {
            }
        }
        mod.init(this, endpoint, cfg || {});
        this.modules[module] = mod;
        return this;
    }
    reloadModule(module, endpoint = null) {
        let cfg = null;
        let modConfig = null;
        if (!endpoint) {
            modConfig = this.config.modules.filter(p => (typeof p == "string" && p == module) || p.file == module);
            console.log("ENDPOINT FREE: ", this.config.modules);
        }
        else {
            modConfig = this.config.endpoints.filter(p => p.name == endpoint)[0].
                modules.filter(p => (typeof p == "string" && p == module) || p.file == module);
        }
        console.log("RELOAD MOD:", modConfig);
        if (modConfig.length > 0 && typeof modConfig[0] != "string") {
            cfg = modConfig[0].options;
        }
        this.loadModule(module, cfg, null);
    }
    unloadModule(module) {
        if (this.modules[module]) {
            this.modules[module].destruct();
            delete this.modules[module];
        }
        for (let i = this.config.modules.length - 1; i >= 0; i--) {
            if (this.config.modules[i] == module) {
                this.config.modules.splice(i, 1);
            }
        }
        return this;
    }
    loginUser(message) {
        let aut = this.auth.get(message.endpoint);
        let msg = message;
        if (!aut) {
            throw new Error("Endpoint authentication sync issue");
        }
        let userAuth = aut.get(message.from.name);
        // User needs to login.
        if (userAuth == null) {
            let parts = msg.message.split(' ');
            if (parts.length < 2) {
                throw new Error("Invalid number of arguments. Needs 2: login <password>");
            }
            // If a user accidentally messages a channel with login, pretend it fails either way for "safety"
            if (!msg.isDirectMessage) {
                return false;
            }
            let authOptions = this.authOptions.get(msg.endpoint).filter(p => p.type == Command_1.CommandAuthTypes.Level);
            if (authOptions.length > 0) {
                for (let option of authOptions) {
                    var hash = crypto.createHash('sha256').update(parts[1]).digest('base64');
                    let [user, pass] = option.value.split(":");
                    if (user == msg.from.name && pass == hash) {
                        aut.set(message.from.name, option.level);
                        return true;
                    }
                }
            }
        }
        else {
            // User is already logged in
            return true;
        }
        return false;
    }
    isUserAuthed(message) {
        let aut = this.auth.get(message.endpoint);
        let level = 1;
        if (!aut) {
            return 1;
        }
        level = aut.get(message.from.name);
        if (!level) {
            level = 1;
            let authOptions = this.authOptions.get(message.endpoint).filter(p => p.type != Command_1.CommandAuthTypes.Level);
            let chan = null;
            if (message.discriminator.indexOf("Message") > 0 && message.target.discriminator.indexOf("Channel") > 0) {
                let chan = message.target;
            }
            for (let option of authOptions) {
                let toTest = null;
                switch (option.type) {
                    case Command_1.CommandAuthTypes.Role:
                        // N/A mostly due to async.
                        break;
                    case Command_1.CommandAuthTypes.Account:
                        toTest = message.from.account;
                        break;
                    case Command_1.CommandAuthTypes.Name:
                        toTest = message.from.name;
                        break;
                    default:
                        throw new Error("Missing command auth type option");
                }
                if (option.valueRegex.test(toTest)) {
                    level = option.level;
                    // We don't want to cache the login info, because not all
                    // servers broadcast name changes, and IRC doesn't gurantee
                    // they are signed in to services.
                    //aut.set(message.from.name, level); // Cache for laters
                    // break;
                }
                if (level > 1) {
                    break;
                }
            }
        }
        return level;
    }
    logoutUser(message) {
        let aut = this.auth.get(message.endpoint);
        if (!aut) {
            return false;
        }
        aut.delete(message.from.name);
        return true;
    }
    // This method is used for module who don't have access to import
    // the command object from the source code (ie: node_modules modules)
    // Since the location of the Command object isn't exactly known by the module
    // we don't want a hard reference to it. This method will return that 
    // reference for us to use when adding commands via addCommand.
    initNewCommand(name, fnc, throttle, binding, auths, serialize = true, requireCommandPrefix = true) {
        return Command_1.Command.Deserialize({
            name: name,
            fnc: fnc,
            throttle: throttle,
            binding: binding,
            auth: auths,
            serialize: serialize,
            requireCommandPrefix: requireCommandPrefix
        });
    }
    addCommand(cmd) {
        if (this.textCommands[cmd.name]) {
            throw new Error("Command already exists");
        }
        this.textCommands[cmd.name] = cmd;
        if (cmd.serialize) {
            this.txtCmdsDirty = true;
        }
        return this;
    }
    delCommand(cmd) {
        if (!this.textCommands[cmd]) {
            throw new Error("Command does not exist");
        }
        delete this.textCommands[cmd];
        return this;
    }
    setCommand(cmd) {
        if (!this.textCommands[cmd.name]) {
            throw new Error("Command does not exist");
        }
        this.textCommands[cmd.name] = cmd;
        if (cmd.serialize) {
            this.txtCmdsDirty = true;
        }
        return this;
    }
    tick() {
        if (this.txtCmdsDirty) {
            let cmdsToSerialize = {};
            for (let key in this.textCommands) {
                let cmd = this.textCommands[key];
                if (cmd.serialize) {
                    cmdsToSerialize[key] = cmd;
                }
            }
            this.txtCmdsDirty = false;
            fs.writeFile(this.cmdStorage, JSON.stringify(cmdsToSerialize, null, 4), function (err) {
                if (err) {
                    console.error("[Bot.ts] There was an issue saving the commands: ", err);
                    setTimeout(() => this.txtCmdsDirty = true, 2000);
                }
            });
        }
    }
    toString() {
        return "[bot Bot]";
    }
}
exports.Bot = Bot;
class Manager extends ManagerConfig_1.ManagerConfig {
    constructor(cfg) {
        super();
        this.type = cfg.type;
        this.level = cfg.level;
        this.value = cfg.value;
        if (this.type != Command_1.CommandAuthTypes.Role) {
            this.valueRegex = new RegExp(this.value);
        }
    }
}
exports.Manager = Manager;
//# sourceMappingURL=Bot.js.map