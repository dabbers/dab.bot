import {Bot} from "./Bot";
import {ProxyBot} from "./ProxyBot";

export class Module {

    constructor(init:(bot:Bot, config:any) => any, destruct:()=>any) {
        this.initCb = init;
        this.destructCb = destruct;
        this.intervals = [];
    }

    init(bot:Bot, validEndpoint:string, config:any):void {
        // TODO: Wrap setInterval and setTimeout
        this.proxyBot = ProxyBot.createProxyBot(bot, validEndpoint);
        this.config = config;

        if (this.initCb) {
            (<any>global).oldInterval = global.setInterval;

            global.setInterval = (callback:(...args:any[])=>void, number):NodeJS.Timer => {
                let n : NodeJS.Timer = (<any>global).oldInterval(callback, number);
    
                // prevent from keeping the event loop open
                n.unref();
                this.intervals.push(n);
                return n;
            };
            try {
                this.initCb(this.proxyBot, config);
            }
            finally {
                global.setInterval = (<any>global).oldInterval;
            }
        }
    }

    destruct():void {
        try {        
            if (this.destructCb) {
                this.destructCb();
            }
        }
        finally 
        {
            // Call dispose afterwards in case the module tries to cleanup after itself.
            (<any>this.proxyBot).dispose();

            for(let timer of this.intervals) {
                clearInterval(timer);
            }
        }
    }
    onWebRequest: (req, res) => any;
    protected config:any;
    private intervals:NodeJS.Timer[];
    private proxyBot : Bot;
    private initCb : (bot:Bot, config:any) => any;
    private destructCb: ()=>any;
}