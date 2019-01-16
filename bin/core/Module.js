"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Module {
    constructor(init, destruct, webReq = null) {
        this.ProxyBot = require('./ProxyBot').ProxyBot;
        this.initCb = init;
        this.destructCb = destruct;
        this.intervals = [];
        this.onWebRequest = webReq;
    }
    init(bot, validEndpoint, config) {
        this.proxyBot = this.ProxyBot.createProxyBot(bot, validEndpoint);
        this.config = config;
        if (this.initCb) {
            global.oldInterval = global.setInterval;
            global.setInterval = (callback, number) => {
                let n = global.oldInterval(callback, number);
                // prevent from keeping the event loop open
                n.unref();
                this.intervals.push(n);
                return n;
            };
            try {
                this.initCb(this.proxyBot, config);
            }
            finally {
                global.setInterval = global.oldInterval;
            }
        }
    }
    destruct() {
        try {
            if (this.destructCb) {
                this.destructCb();
            }
        }
        finally {
            // Call dispose afterwards in case the module tries to cleanup after itself.
            this.proxyBot.dispose();
            for (let timer of this.intervals) {
                clearInterval(timer);
            }
        }
    }
}
exports.Module = Module;
//# sourceMappingURL=Module.js.map