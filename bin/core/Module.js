"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ProxyBot_1 = require("./ProxyBot");
class Module {
    constructor(init, destruct) {
        this.initCb = init;
        this.destructCb = destruct;
        this.intervals = [];
    }
    init(bot, validEndpoint, config) {
        // TODO: Wrap setInterval and setTimeout
        this.proxyBot = ProxyBot_1.ProxyBot.createProxyBot(bot, validEndpoint);
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