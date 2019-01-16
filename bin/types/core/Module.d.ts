import { Bot } from "./Bot";
export declare class Module {
    ProxyBot: any;
    constructor(init: (bot: Bot, config: any) => any, destruct: () => any, webReq?: (req, res) => any);
    init(bot: Bot, validEndpoint: string, config: any): void;
    onWebRequest: (req, res) => any;
    destruct(): void;
    config: any;
    private intervals;
    private proxyBot;
    private initCb;
    private destructCb;
}
