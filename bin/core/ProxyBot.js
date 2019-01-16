"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Bot_1 = require("./Bot");
class EventTracker {
    constructor(event, cb) {
        this.event = event;
        this.cb = cb;
    }
}
exports.EventTracker = EventTracker;
class ProxyBot extends Bot_1.Bot {
    constructor(realBot) {
        super(realBot.config);
        this.discriminator = "ProxyBot";
        this.addedCommands = [];
        this.addedEvents = [];
        this.realBot = realBot;
    }
    static createProxyBot(realBot, limitEndpointTo) {
        let proxyBot = new Proxy(new ProxyBot(realBot), {
            get: (proxy, name) => {
                switch (name) {
                    case "addCommand":
                        return function (cmd) {
                            proxy.addedCommands.push(cmd.name);
                            proxy.realBot.addCommand.apply(proxy.realBot, [cmd]);
                            return proxyBot;
                        };
                    case "dispose":
                        return function () {
                            proxy.addedCommands.forEach((v, i, a) => {
                                // In case a command was already removed, catch the execption
                                try {
                                    proxy.realBot.delCommand(v);
                                }
                                catch (_a) { }
                            });
                            proxy.addedEvents.forEach((v, i, a) => {
                                proxy.realBot.removeListener(v.event, v.cb);
                            });
                        };
                    case "on":
                        return function (event, fnc) {
                            let overrideFnc = (...args) => {
                                let tryEp = args[0];
                                if ((!tryEp.name && !tryEp.type) || (!limitEndpointTo) || (tryEp.name == limitEndpointTo)) {
                                    fnc.apply(proxyBot, args);
                                }
                            };
                            proxy.realBot.on(event, overrideFnc);
                            proxy.addedEvents.push(new EventTracker(event, overrideFnc));
                            return proxy;
                        };
                    case "endpoints":
                        if (limitEndpointTo) {
                            let ob = {};
                            ob[limitEndpointTo] = proxy.realBot.endpoints[limitEndpointTo];
                        }
                    // Intentional fallthrough
                    default:
                        return proxy.realBot[name];
                }
            }
        });
        return proxyBot;
    }
}
exports.ProxyBot = ProxyBot;
//# sourceMappingURL=ProxyBot.js.map