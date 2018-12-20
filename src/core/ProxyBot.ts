import {Bot} from './Bot';
import { IEndpoint } from './IEndpoint';

export class EventTracker {
    constructor(event:string, cb:(...args:any[]) => any) {
        this.event = event;
        this.cb = cb;
    }

    event:string;
    cb: (...args:any[]) => any;
}

export class ProxyBot extends Bot {
    public addedCommands :string[] = [];
    public addedEvents : EventTracker[] = [];

    public realBot : Bot;

    constructor(realBot:Bot) {
        super(realBot.config);

        this.realBot = realBot;
    }   

    static createProxyBot(realBot:Bot, limitEndpointTo:string) : Bot {
        return new Proxy<ProxyBot>(new ProxyBot(realBot), {
            get: (proxy, name) => {
                switch(name) {
                    case "addCommand":
                        throw new Error("TODO: addCommand for ProxyBot");
                    case "dispose":
                        return function() {
                            console.log("[ProxyBot.ts] Proxybot dispose");
                            // proxy.addedCommands.forEach( (v, i, a) => {
                            //     proxy.realBot.delCommand(v);
                            // });
                            proxy.addedEvents.forEach( (v, i, a) => {
                                proxy.realBot.removeListener(v.event, v.cb);
                            });
                        }
                    case "on":
                        return function(event:string, fnc:(...args:any[]) => any) {
                            console.log("[ProxBot.ts] Todo: Wrap event callback functions in proxy bot");

                            let overrideFnc = (...args:any[]) => {
                                let tryEp = <IEndpoint>args[0];
                                console.log("PB on " + (limitEndpointTo || "null"));
                                console.log(tryEp.name, tryEp.type);
                                
                                if ((!tryEp.name && !tryEp.type) || (!limitEndpointTo) || (tryEp.name == limitEndpointTo)) {
                                    fnc.apply(proxy, args);
                                }
                            };

                            proxy.realBot.on(event, overrideFnc);
                            proxy.addedEvents.push(new EventTracker(event, overrideFnc));
                            return proxy;
                        }
                    case "endpoints":
                        if (limitEndpointTo) {
                            return [ proxy.realBot.endpoints[limitEndpointTo] ];
                        }
                        // Intentional fallthrough
                    default:
                        return (<any>proxy.realBot)[name];
                }
            }
        });
    }
}