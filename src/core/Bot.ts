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

export class Bot extends EventEmitter implements ITickable, IAuthable {

    constructor(config:BotConfig) {
        super();

        this.config = config;
        this.modules = {};
        this.endpoints = {};

        this.auth = new  Map<IEndpoint, Map<string, number>>();
        this.authOptions = new Map<IEndpoint, Manager[]>();

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

        this.on(EndpointEvents.Message, (sender:IEndpoint, msg:IMessage) =>
        {            
            let parts = msg.message.split(" ");
            let cmd = this.textCommands[parts[0]];

            if (cmd && !cmd.requireCommandPrefix) {
                cmd.execute(this, msg);
            }
            else if (msg.message[0] == sender.config.commandPrefix) {
                cmd = this.textCommands[parts[0].substr(1)];

                if (cmd) {
                    cmd.execute(this, msg);
                }
            }
        });
    }

    init() : void {
        for(let i = 0; i < this.config.endpoints.length; i++) {
            let ep = this.config.endpoints[i];

            let endpointKey = ep.name || ep.type.toString();
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
                default:
                    throw new Error("Missing endpoint type: " + ep.type.toString());
            }

            this.endpoints[endpointKey] = endpoint;

            for(let name in ep.modules) {
                this.loadModule(name, endpointKey);
            }
            
            this.authOptions.set(endpoint, ep.managers.map(p => new Manager(p)));
        }

        // Some modules may require certain endpoints for init.
        if (this.config.modules) {
            for(let i = 0; i < this.config.modules.length; i++) {
                this.loadModule(this.config.modules[i]);
            }
        }

        // Wait for each endpoint to be created before connecting
        let keys = Object.keys(this.endpoints);
        for(let key in keys) {
            if (this.endpoints.hasOwnProperty(keys[key])) {
                this.endpoints[keys[key]].on(EndpointEvents.Connected.toString(), (...args:any[]) => {
                    args.unshift(EndpointEvents.Connected.toString());
                    this.emit.apply(this, args);
                });
                this.endpoints[keys[key]].on(EndpointEvents.NewChannel.toString(), (...args:any[]) => {
                    args.unshift(EndpointEvents.NewChannel.toString());
                    this.emit.apply(this, args);
                });
                this.endpoints[keys[key]].on(EndpointEvents.UserJoin.toString(), (...args:any[]) => {
                    args.unshift(EndpointEvents.UserJoin.toString());
                    this.emit.apply(this, args);
                });
                this.endpoints[keys[key]].on(EndpointEvents.UserLeave.toString(), (...args:any[]) => {
                    args.unshift(EndpointEvents.UserLeave.toString());
                    this.emit.apply(this, args);
                });
                this.endpoints[keys[key]].on(EndpointEvents.NameChange.toString(), (...args:any[]) => {
                    args.unshift(EndpointEvents.NameChange.toString());
                    this.emit.apply(this, args);
                });
                this.endpoints[keys[key]].on(EndpointEvents.Disconnected.toString(), (...args:any[]) => {
                    args.unshift(EndpointEvents.Disconnected.toString());
                    this.emit.apply(this, args);
                });
                this.endpoints[keys[key]].on(EndpointEvents.Message.toString(), (...args:any[]) => {
                    args.unshift(EndpointEvents.Message.toString());
                    this.emit.apply(this, args);
                });
                this.endpoints[keys[key]].connect();
            }
        }
    }

    loadModule(module:string, endpoint:string = null) : Bot {
        if (this.modules[module]) {
            this.unloadModule(module);

            let keys = Object.keys(require.cache);
            for(let key in keys) {
                if (key.indexOf(module) >= 0) {
                    delete require.cache[module];
                }
            }
        }

        let mod = <Module>require(module);
        if (!mod.init) throw new Error("Module missing init");

        if (this.config.modules.indexOf(module) == -1) {
            this.config.modules.push(module);
        }

        mod.init(this, endpoint, false);
        this.modules[module] = mod;        

        return this;
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

    loginUser(message: IEvent): boolean {
        let aut = this.auth.get(message.endpoint);
        let msg = <IMessage>message;

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
                    case CommandAuthTypes.Name:
                        toTest = message.from.name;
                        if (option.valueRegex.test(toTest)) {
                            level = option.level;
                            aut.set(message.from.name, level); // Cache for laters
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

    logoutUser(message: IEvent): boolean {
        let aut = this.auth.get(message.endpoint);
        if (!aut) {
            return false;
        }

        aut.delete(message.from.name);
        return true;
    }

    addCommand(cmd:Command<IMessage>) : Bot {
        if (this.textCommands[cmd.name]) {
            throw new Error("Command already exists");
        }

        this.textCommands[cmd.name] = cmd;

        if (cmd.serialize) {
            this.txtCmdsDirty = true;
        }
        return this;
    }

    delCommand(cmd:string) : Bot {
        
        if (!this.textCommands[cmd]) {
            throw new Error("Command does not exist");
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

            let cmdStorage = path.join(this.config.storagePath, "botcmd.json");

            fs.writeFile(cmdStorage, JSON.stringify(cmdsToSerialize, null, 4), function (err) {
                if (err) {
                    console.log("[Bot.ts] There was an issue saving the commands: ", err);
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
}

class Manager extends ManagerConfig {
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
