import {Bot} from "./Bot";

export class Module {
    ProxyBot = require('./ProxyBot').ProxyBot;

    constructor(init:(bot:Bot, config:any) => any, destruct:()=>any, webReq:(req,res) => any = null) {
        this.initCb = init;
        this.destructCb = destruct;
        this.intervals = [];
        this.onWebRequest = webReq;
    }

    init(bot:Bot, validEndpoint:string, config:any):void {
        this.proxyBot = this.ProxyBot.createProxyBot(bot, validEndpoint);
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
    
    onWebRequest:(req,res)=>any;

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
    
    config:any;
    private intervals:NodeJS.Timer[];
    private proxyBot : Bot;
    private initCb : (bot:Bot, config:any) => any;
    private destructCb: ()=>any;
}