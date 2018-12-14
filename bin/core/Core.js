"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Bot_1 = require("./Bot");
const WatchWithProxy = require("watchwithproxy");
class CoreContext {
    constructor(config) {
        let watchOptions = new WatchWithProxy.WatchOptions();
        let listener = (sender, property, oldval, newval) => {
            console.log("Updated callback! sender: ", sender.toString(), "property:", property, "old:", oldval, "new:", newval);
            this.config.isDirty = true;
        };
        let watchedConfig = WatchWithProxy.Watcher.Watch(config, watchOptions, listener);
        this.config = watchedConfig;
    }
    tick() {
        // The bot might cause some config changes during the tick.
        // perform the tick later.
        this.bot.tick();
        this.config.tick();
    }
    init() {
        this.bot = new Bot_1.Bot(this.config.bot);
        this.bot.init();
    }
}
exports.CoreContext = CoreContext;
//# sourceMappingURL=Core.js.map