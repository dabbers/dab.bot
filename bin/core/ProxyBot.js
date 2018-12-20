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
        this.addedCommands = [];
        this.addedEvents = [];
        this.realBot = realBot;
    }
    static createProxyBot(realBot, limitEndpointTo) {
        return new Proxy(new ProxyBot(realBot), {
            get: (proxy, name) => {
                switch (name) {
                    case "addCommand":
                        throw new Error("TODO: addCommand for ProxyBot");
                    case "dispose":
                        return function () {
                            console.log("[ProxyBot.ts] Proxybot dispose");
                            // proxy.addedCommands.forEach( (v, i, a) => {
                            //     proxy.realBot.delCommand(v);
                            // });
                            proxy.addedEvents.forEach((v, i, a) => {
                                proxy.realBot.removeListener(v.event, v.cb);
                            });
                        };
                    case "on":
                        return function (event, fnc) {
                            console.log("[ProxBot.ts] Todo: Wrap event callback functions in proxy bot");
                            let overrideFnc = (...args) => {
                                let tryEp = args[0];
                                console.log("PB on " + (limitEndpointTo || "null"));
                                console.log(tryEp.name, tryEp.type);
                                if ((!tryEp.name && !tryEp.type) || (!limitEndpointTo) || (tryEp.name == limitEndpointTo)) {
                                    fnc.apply(proxy, args);
                                }
                            };
                            proxy.realBot.on(event, overrideFnc);
                            proxy.addedEvents.push(new EventTracker(event, overrideFnc));
                            return proxy;
                        };
                    case "endpoints":
                        if (limitEndpointTo) {
                            return [proxy.realBot.endpoints[limitEndpointTo]];
                        }
                    // Intentional fallthrough
                    default:
                        return proxy.realBot[name];
                }
            }
        });
    }
}
exports.ProxyBot = ProxyBot;
//# sourceMappingURL=ProxyBot.js.map