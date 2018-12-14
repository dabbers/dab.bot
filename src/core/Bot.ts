import * as EventEmitter from 'events';
import {BotConfig} from "./config/BotConfig";
import {Module} from './Module';
import { IEndpoint, EndpointEvents } from './IEndpoint';
import {EndpointTypes} from './EndpointTypes';
import {IrcEndpoint} from './endpoints/IrcEndpoint';
import {TelegramEndpoint} from './endpoints/TelegramEndpoint';
import {DiscordEndpoint} from './endpoints/DiscordEndpoint';
import {ITickable} from './ITickable';
import {Command} from './Command';
import { IEvent } from './Events/IEvent';
import {IMessage} from './Events/IMessage';
import {IJoin} from './Events/IJoin';
import {ILeave} from './Events/ILeave';

export class Bot extends EventEmitter implements ITickable {

    constructor(config:BotConfig) {
        super();

        this.config = config;
        this.modules = {};
        this.endpoints = {};
    }

    init() : void {
        for(let i = 0; i < this.config.endpoints.length; i++) {
            let ep = this.config.endpoints[i];

            let endpointKey = ep.name || ep.type.toString();
            let endpoint = null;

            if (this.endpoints[endpointKey]) throw "Duplicate endpoint: '" + endpointKey + "'. Specifying a unique name will resolve this.";

            switch(ep.type) {
                case EndpointTypes.IRC:
                    endpoint = new IrcEndpoint(ep);
                    break;
                case EndpointTypes.Telegram:
                    endpoint = new TelegramEndpoint(ep);
                    break;
                case EndpointTypes.Discord:
                    endpoint = new DiscordEndpoint(ep);
                    break;
                default:
                    throw "Missing endpoint type: " + ep.type.toString();
            }

            this.endpoints[endpointKey] = endpoint;

            for(let name in ep.modules) {
                this.loadModule(name, endpointKey);
            }
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
        if (!mod.init) throw "Module missing init";

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

    tick() : void {
        // Todo: Save commands to file.
    }

    endpoints:{ [ key:string ] : IEndpoint };

    config:BotConfig;
    modules:{ [ key:string ] : Module };

    textCommands: { [key:string] : Command<IMessage>};
    joinCommands: { [key:string] : Command<IJoin>};
    leaveCommands: { [key:string] : Command<ILeave>};
}
