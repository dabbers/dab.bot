"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventEmitter = require("events");
const IEndpoint_1 = require("./IEndpoint");
const EndpointTypes_1 = require("./EndpointTypes");
const IrcEndpoint_1 = require("./endpoints/IrcEndpoint");
const TelegramEndpoint_1 = require("./endpoints/TelegramEndpoint");
const DiscordEndpoint_1 = require("./endpoints/DiscordEndpoint");
class Bot extends EventEmitter {
    loginUser(message) {
        throw new Error("Method not implemented.");
    }
    isUserAuthed(message) {
        throw new Error("Method not implemented.");
    }
    logoutUser(message) {
        throw new Error("Method not implemented.");
    }
    constructor(config) {
        super();
        this.config = config;
        this.modules = {};
        this.endpoints = {};
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
    tick() {
        // Todo: Save commands to file.
    }
}
exports.Bot = Bot;
//# sourceMappingURL=Bot.js.map