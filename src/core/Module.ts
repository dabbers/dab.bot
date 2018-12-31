import {Bot} from "./Bot";
import {ProxyBot} from "./ProxyBot";

export class Module {

    constructor(init:(bot:Bot, globalModule:boolean) => any, destruct:()=>any) {
        this.initCb = init;
        this.destructCb = destruct;
    }

    init(bot:Bot, validEndpoint:string, globalModule:boolean):void {
        // TODO: Wrap setInterval and setTimeout
        this.proxyBot = ProxyBot.createProxyBot(bot, validEndpoint);

        if (this.initCb) {
            this.initCb(this.proxyBot, globalModule);
        }
    }

    destruct():void {
        if (this.destructCb) {
            this.destructCb();
        }
    }

    private proxyBot : Bot;
    private initCb : (bot:Bot, globalModule:boolean) => any;
    private destructCb: ()=>any;
}