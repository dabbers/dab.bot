import * as EventEmitter from 'events';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import {BotConfig} from "./config/BotConfig";
import {Module} from './Module';
import { IEndpoint, EndpointEvents } from './IEndpoint';
import {EndpointTypes} from './EndpointTypes';
import {IrcEndpoint, IrcMessage} from './endpoints/IrcEndpoint';
import {TelegramEndpoint} from './endpoints/TelegramEndpoint';
import {DiscordEndpoint} from './endpoints/DiscordEndpoint';
import {ITickable} from './ITickable';
import {Command, CommandAuthTypes, CommandThrottleOptions, CommandBindOptions} from './Command';
import { IEvent } from './Events/IEvent';
import {IMessage} from './Events/IMessage';
import { IAuthable } from './IAuthable';
import { ManagerConfig } from './config/ManagerConfig';
import {INameChange} from './Events/INameChange';
import {IChannel} from './IChannel';
import { ICommandMessage } from './CommandMessage';
import { ModuleConfig } from './config/ModuleConfig';
import { TwitchEndpoint } from './endpoints/TwitchEndpoint';
import { BotFrameworkEndpoint } from './endpoints/BotFrameworkEndpoint';
import { IEventable } from './IEventable';
import { EndpointConfig } from './config/EndpointConfig';

export interface ICommandThrottleOptions {
    user:number,
    channel:number,
    endpoint:number
}
export interface ICommandBindOptions {
    binding:string
}

export interface ICommandAuthOptions {
    authType:("account" | "level" | "name" | "role"),
    authValue:string
}

export class Bot extends EventEmitter implements ITickable, IAuthable, IEventable {
    discriminator:string = "Bot";
    /*const*/ cmdStorage = "";

    constructor(config:BotConfig) {
        super();

        this.config = config;
        this.modules = {};
        this.endpoints = {};
        this.textCommands = {};
        this.auth = new  Map<IEndpoint, Map<string, number>>();
        this.authOptions = new Map<IEndpoint, Manager[]>();
        this.cmdStorage = path.join(this.config.storagePath, "botcmd.json");

        this.on(EndpointEvents.Connected, (sender:IEndpoint) => {
            console.log(sender.name, "OnConnected");
        });
        this.on(EndpointEvents.UserLeave,  (sender:IEndpoint, msg:IEvent) =>
        {
            this.logoutUser(msg);
        });

        this.on(EndpointEvents.NameChange,  (sender:IEndpoint, msg:INameChange) =>
        {
            let level = this.isUserAuthed(msg);
            if (level  > 1) {
                this.auth.get(sender).delete(msg.from.name);
                this.auth.get(sender).set(msg.newName, level);
            }
        });

        // this.on(EndpointEvents.Message, this.onMessage);
    }

    async onMessage (sender:IEndpoint, msg:IMessage) : Promise<void>
    {
        let parts = msg.message.split(" ");
        let cmdStr = parts[0].toLowerCase();

        // Cast our msg to ICommandMessage so we can add command specific argument info.
        let cmdMsg = <ICommandMessage>msg;

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
                    cmdMsg.args = parts.slice(2)
                }
                else {  // Maybe the bot's name is a command?
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
            if (cmd && !cmd.requireCommandPrefix) {
                await cmd.execute(this, cmdMsg);
            }
            else if (cmdStr[0] == sender.config.commandPrefix) {
                cmd = this.textCommands[cmdStr.substr(1)];

                if (cmd) {
                    await cmd.execute(this, cmdMsg);
                }
            }
        }
        catch (er) {
            if (this.isUserAuthed(msg) >= 3) {
                sender.say(msg.from, "[Error] " + er);
            }
        }
    }
    init() : void {
        // Load the commands before other things in case they add commands during init/module load.
        let deser = JSON.parse(fs.readFileSync(this.cmdStorage).toString());
        let deserKeys = Object.keys(deser);
        
        for(let i = 0; i < this.config.endpoints.length; i++) {
            let ep = this.config.endpoints[i];

            let endpointKey = ep.name || ep.type.toString();
            this.createEndpoint(endpointKey, ep);
        }

        deserKeys.forEach(p => this.addCommand(Command.Deserialize<IMessage>(deser[p])));

        // Some modules may require certain endpoints for init.
        if (this.config.modules) {
            for(let i = 0; i < this.config.modules.length; i++) {
                let mod = this.config.modules[i];

                if (typeof mod == "string") {
                    this.loadModule(mod);
                }
                else {
                    this.loadModule(mod.file, mod.options);
                }
            }
        }
    }

    createEndpoint(endpointKey: string, ep: EndpointConfig) {
        let endpoint = null;
        if (this.endpoints[endpointKey]) {
            throw new Error("Duplicate endpoint: '" + endpointKey + "'. Specifying a unique name will resolve this.");
        }

        switch(ep.type) {
            case EndpointTypes.IRC:
                endpoint = new IrcEndpoint(ep, this);
                break;
            case EndpointTypes.Telegram:
                endpoint = new TelegramEndpoint(ep, this);
                break;
            case EndpointTypes.Discord:
                endpoint = new DiscordEndpoint(ep, this);
                break;
            case EndpointTypes.Twitch:
                endpoint = new TwitchEndpoint(ep, this);
                break;
            case EndpointTypes.BotFramework:
                endpoint = new BotFrameworkEndpoint(ep, this);
                break;
            default:
                throw new Error("Missing endpoint type: " + ep.type.toString());
        }

        this.endpoints[endpointKey] = endpoint;

        if (ep.modules) {
            for(let name of ep.modules) {
                if (typeof name == "string") {
                    this.loadModule(name, null, endpointKey);
                }
                else {
                    this.loadModule(name.file, name.options, endpointKey);
                }
            }
        }

        this.authOptions.set(endpoint, ep.managers.map(p => new Manager(p)));
        this.auth.set(endpoint, new Map<string,number>());

        // Todo: Find a more dynamic way to do this.
        endpoint.on(EndpointEvents.Connected.toString(), (...args:any[]) => {
            args.unshift(EndpointEvents.Connected.toString());
            this.emit.apply(this, args);
        });
        endpoint.on(EndpointEvents.NewChannel.toString(), (...args:any[]) => {
            args.unshift(EndpointEvents.NewChannel.toString());
            this.emit.apply(this, args);
        });
        endpoint.on(EndpointEvents.UserJoin.toString(), (...args:any[]) => {
            args.unshift(EndpointEvents.UserJoin.toString());
            this.emit.apply(this, args);
        });
        endpoint.on(EndpointEvents.UserLeave.toString(), (...args:any[]) => {
            args.unshift(EndpointEvents.UserLeave.toString());
            this.emit.apply(this, args);
        });
        endpoint.on(EndpointEvents.NameChange.toString(), (...args:any[]) => {
            args.unshift(EndpointEvents.NameChange.toString());
            this.emit.apply(this, args);
        });
        endpoint.on(EndpointEvents.Disconnected.toString(), (...args:any[]) => {
            args.unshift(EndpointEvents.Disconnected.toString());
            this.emit.apply(this, args);
        });
        endpoint.on(EndpointEvents.Message.toString(), (...args:any[]) => {
            args.unshift(EndpointEvents.Message.toString());
            this.emit.apply(this, args);
        });

        endpoint.connect();
        return endpoint;
    }

    loadModule(module:string, cfg:any = null, endpoint:string = null) : Bot {
        console.log("LOAD MODULE", module, endpoint);
        if (this.modules[module]) {
            this.unloadModule(module);

            let keys = Object.keys(require.cache);
            let filename = path.basename(module);
            
            for(let key of keys) {
                if (key.indexOf(filename) > 0) {
                    delete require.cache[key];
                    break;
                }
            }
        }

        let mod = null;
        try {
            mod = <Module>require(module);
        }
        catch (ex) {
            if (ex.message.indexOf("Cannot find module") >= 0) {
                mod = <Module>require('../modules/' + module);
            }
            else {
                throw ex;
            }
        }

        if (!mod.create) throw new Error("Module missing create");
        mod = mod.create(Module);
        if (!mod.init) throw new Error("Created module missing init");

        if (!endpoint && this.config.modules.filter(p => (typeof p == "string" && p == module) || (<ModuleConfig>p).file == module).length == 0) {
            let m : string|ModuleConfig = module;
            if (cfg) {
                m = new ModuleConfig();
                m.options = cfg;
                m.file = module;
            }

            this.config.modules.push(m);
        }
        else if (endpoint) {
            let ep = this.config.endpoints.filter(p => p.name == endpoint);
        
            if (ep.length > 0 && ep[0].
                modules.filter(p => (typeof p == "string" && p == module) || (<ModuleConfig>p).file == module).length == 0) {
                
                
            }
        }

        mod.init(this, endpoint, cfg || {});
        this.modules[module] = mod;

        return this;
    }

    reloadModule(module:string, endpoint:string = null) {
        
        let cfg = null;
        let modConfig = null;

        if (!endpoint) {
            modConfig = this.config.modules.filter(p => (typeof p == "string" && p == module) || (<ModuleConfig>p).file == module);
            console.log("ENDPOINT FREE: ", this.config.modules);
        }
        else {
            modConfig = this.config.endpoints.filter(p => p.name == endpoint)[0].
                modules.filter(p => (typeof p == "string" && p == module) || (<ModuleConfig>p).file == module);
        }
        console.log("RELOAD MOD:", modConfig);
        if (modConfig.length > 0 && typeof modConfig[0] != "string") {
            cfg = (<ModuleConfig>modConfig[0]).options;
        }

        this.loadModule(module, cfg, null);
    }

    unloadModule(module:string) : Bot {

        if(this.modules[module]) {
            this.modules[module].destruct();
            delete this.modules[module];
        }

        for(let i = this.config.modules.length-1; i >= 0; i--) {
            if (this.config.modules[i] == module) {
                this.config.modules.splice(i, 1);
            }
        }

        return this;
    }

    loginUser(message: IMessage): boolean {
        let aut = this.auth.get(message.endpoint);
        let msg = <IMessage>message;

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

            let authOptions = this.authOptions.get(msg.endpoint).filter(p => p.type == CommandAuthTypes.Level);
            if (authOptions.length > 0) {
                for(let option of authOptions) {
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

    isUserAuthed(message:IEvent): number {
        let aut = this.auth.get(message.endpoint);

        let level = 1;
        if (!aut) {
            return 1;
        }

        level = aut.get(message.from.name);

        if (!level) {
            level = 1;
            let authOptions = this.authOptions.get(message.endpoint).filter(p => p.type != CommandAuthTypes.Level);
            let chan :IChannel = null;
            if (message.discriminator.indexOf("Message") > 0 && (<IMessage><any>message).target.discriminator.indexOf("Channel") > 0) {
                let chan = (<IChannel>(<IMessage><any>message).target);
            }

            for(let option of authOptions) {
                let toTest = null;

                switch(option.type) {
                    case CommandAuthTypes.Role:
                        // N/A mostly due to async.
                        break;
                    case CommandAuthTypes.Account:
                        toTest = message.from.account;
                        break;
                    case CommandAuthTypes.Name:
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

    logoutUser(message: IEvent): boolean {
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
    initNewCommand(
        name:string, 
        fnc:(Bot,IEvent) => any, 
        throttle: ICommandThrottleOptions,
        binding:ICommandBindOptions[], 
        auths:ICommandAuthOptions[], 
        serialize:boolean = true,
        requireCommandPrefix = true) : Command<IMessage> {

        return Command.Deserialize(
            {
                name:name,
                fnc:fnc,
                throttle:throttle,
                binding:binding,
                auth:auths,
                serialize:serialize,
                requireCommandPrefix:requireCommandPrefix
            }
        );
    }

    addCommand(cmd:Command<IMessage>) : Bot {
        if (this.textCommands[cmd.name]) {
            throw new Error("Command already exists");
        }

        this.textCommands[cmd.name] = cmd;

        // Only commands that require a prefix can be handled by endpoint speciifc
        // command handlers. 
        if (cmd.requireCommandPrefix) {
            for(let endpoint of Object.keys(this.endpoints)) {
                if (cmd.binding.length == 0 || cmd.binding.filter(b => b.isEndpointAllowed(this.endpoints[endpoint])).length > 0) {
                    this.endpoints[endpoint].registerCommand(cmd);
                }
            }
        }

        if (cmd.serialize) {
            this.txtCmdsDirty = true;
        }

        return this;
    }

    delCommand(cmd:string) : Bot {

        if (!this.textCommands[cmd]) {
            throw new Error("Command does not exist");
        }
        if (this.textCommands[cmd].requireCommandPrefix) {
            for(let endpoint of Object.keys(this.endpoints)) {
                this.endpoints[endpoint].deregisterCommand(this.textCommands[cmd]);
            }
        }
        delete this.textCommands[cmd];
        return this;
    }

    setCommand(cmd:Command<IEvent>) :Bot {

        if (!this.textCommands[cmd.name]) {
            throw new Error("Command does not exist");
        }
        this.textCommands[cmd.name] = cmd;

        if (cmd.serialize) {
            this.txtCmdsDirty = true;
        }
        return this;
    }

    tick() : void {
        if (this.txtCmdsDirty) {
            let cmdsToSerialize:{[key:string]:Command<IMessage>} = {};


            for(let key in this.textCommands) {
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

    endpoints:{ [ key:string ] : IEndpoint };

    config:BotConfig;
    modules:{ [ key:string ] : Module };

    textCommands: { [key:string] : Command<IMessage>};

    txtCmdsDirty:boolean = false;

    auth: Map<IEndpoint, Map<string, number>>;
    authOptions: Map<IEndpoint, Manager[]>;

    toString() : string {
        return "[bot Bot]";
    }
}

export class Manager extends ManagerConfig {
    constructor(cfg:ManagerConfig) {
        super();

        this.type = cfg.type;
        this.level = cfg.level;
        this.value = cfg.value;

        if (this.type != CommandAuthTypes.Role) {
            this.valueRegex = new RegExp(this.value);
        }
    }

    valueRegex: RegExp;
}
