import { Bot } from './Bot';
export declare class EventTracker {
    constructor(event: string, cb: (...args: any[]) => any);
    event: string;
    cb: (...args: any[]) => any;
}
export declare class ProxyBot extends Bot {
    discriminator: string;
    addedCommands: string[];
    addedEvents: EventTracker[];
    realBot: Bot;
    constructor(realBot: Bot);
    static createProxyBot(realBot: Bot, limitEndpointTo: string): Bot;
}
