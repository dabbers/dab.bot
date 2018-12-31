"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventEmitter = require("events");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const IEndpoint_1 = require("./IEndpoint");
const EndpointTypes_1 = require("./EndpointTypes");
const IrcEndpoint_1 = require("./endpoints/IrcEndpoint");
const TelegramEndpoint_1 = require("./endpoints/TelegramEndpoint");
const DiscordEndpoint_1 = require("./endpoints/DiscordEndpoint");
const Command_1 = require("./Command");
const ManagerConfig_1 = require("./config/ManagerConfig");
class Bot extends EventEmitter {
    constructor(config) {
        super();
        this.discriminator = "Bot";
        this.txtCmdsDirty = false;
        this.config = config;
        this.modules = {};
        this.endpoints = {};
        this.textCommands = {};
        this.auth = new Map();
        this.authOptions = new Map();
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
        this.on(IEndpoint_1.EndpointEvents.Message, (sender, msg) => {
            let parts = msg.message.split(" ");
            let cmd = this.textCommands[parts[0].toLowerCase()];
            if (cmd && !cmd.requireCommandPrefix) {
                cmd.execute(this, msg);
            }
            else if (msg.message[0] == sender.config.commandPrefix) {
                cmd = this.textCommands[parts[0].substr(1).toLowerCase()];
                if (cmd) {
                    cmd.execute(this, msg);
                }
            }
        });
    }
    init() {
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
                default:
                    throw new Error("Missing endpoint type: " + ep.type.toString());
            }
            this.endpoints[endpointKey] = endpoint;
            for (let name in ep.modules) {
                this.loadModule(name, endpointKey);
            }
            this.authOptions.set(endpoint, ep.managers.map(p => new Manager(p)));
            this.auth.set(endpoint, new Map());
        }
        // Some modules may require certain endpoints for init.
        if (this.config.modules) {
            for (let i = 0; i < this.config.modules.length; i++) {
                this.loadModule(this.config.modules[i]);
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
    loadModule(module, endpoint = null) {
        if (this.modules[module]) {
            this.unloadModule(module);
            let keys = Object.keys(require.cache);
            for (let key in keys) {
                if (key.indexOf(module) >= 0) {
                    delete require.cache[module];
                }
            }
        }
        let mod = require(module);
        if (!mod.init)
            throw new Error("Module missing init");
        if (this.config.modules.indexOf(module) == -1) {
            this.config.modules.push(module);
        }
        mod.init(this, endpoint, false);
        this.modules[module] = mod;
        return this;
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
        let userAuth = aut.get(message.from.account);
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
                    case Command_1.CommandAuthTypes.Name:
                        toTest = message.from.name;
                        if (option.valueRegex.test(toTest)) {
                            level = option.level;
                            // We don't want to cache the login info, because not all
                            // servers broadcast name changes, and IRC doesn't gurantee
                            // they are signed in to services.
                            //aut.set(message.from.name, level); // Cache for laters
                            break;
                        }
                        break;
                    default:
                        throw new Error("Missing command auth type option");
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
            let cmdStorage = path.join(this.config.storagePath, "botcmd.json");
            fs.writeFile(cmdStorage, JSON.stringify(cmdsToSerialize, null, 4), function (err) {
                if (err) {
                    console.log("[Bot.ts] There was an issue saving the commands: ", err);
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
//# sourceMappingURL=Bot.js.map