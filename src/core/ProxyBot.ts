import {Bot} from './Bot';
import { IEndpoint } from './IEndpoint';
import { Command } from './Command';
import { IMessage } from './Events/IMessage';

export class EventTracker {
    constructor(event:string, cb:(...args:any[]) => any) {
        this.event = event;
        this.cb = cb;
    }

    event:string;
    cb: (...args:any[]) => any;
}

export class ProxyBot extends Bot {
    discriminator:string = "ProxyBot";
    public addedCommands :string[] = [];
    public addedEvents : EventTracker[] = [];

    public realBot : Bot;

    constructor(realBot:Bot) {
        super(realBot.config);

        this.realBot = realBot;
    }   

    static createProxyBot(realBot:Bot, limitEndpointTo:string) : Bot {
        let proxyBot = new Proxy<ProxyBot>(new ProxyBot(realBot), {
            get: (proxy, name) => {
                switch(name) {
                    case "addCommand":
                        return function(cmd:Command<IMessage>) {
                            proxy.addedCommands.push(cmd.name);
                            proxy.realBot.addCommand.apply(proxy.realBot, [cmd]);
                            return proxyBot;
                        };
                    case "dispose":
                        return function() {
                            proxy.addedCommands.forEach( (v, i, a) => {
                                proxy.realBot.delCommand(v);
                            });
                            proxy.addedEvents.forEach( (v, i, a) => {
                                proxy.realBot.removeListener(v.event, v.cb);
                            });
                        }
                    case "on":
                        return function(event:string, fnc:(...args:any[]) => any) {
                            let overrideFnc = (...args:any[]) => {
                                let tryEp = <IEndpoint>args[0];
                                
                                if ((!tryEp.name && !tryEp.type) || (!limitEndpointTo) || (tryEp.name == limitEndpointTo)) {
                                    console.log("PERFORM FNC");
                                    fnc.apply(proxyBot, args);
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

        return proxyBot;
    }
}