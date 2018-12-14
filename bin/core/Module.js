"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ProxyBot_1 = require("./ProxyBot");
class Module {
    constructor(init, destruct) {
        this.initCb = init;
        this.destructCb = destruct;
    }
    init(bot, validEndpoint, globalModule) {
        // TODO: Wrap setInterval and setTimeout
        this.proxyBot = ProxyBot_1.ProxyBot.createProxyBot(bot, validEndpoint);
        if (this.initCb) {
            this.initCb(this.proxyBot, globalModule);
        }
    }
    destruct() {
        if (this.destructCb) {
            this.destructCb();
        }
    }
}
exports.Module = Module;
//# sourceMappingURL=Module.js.map