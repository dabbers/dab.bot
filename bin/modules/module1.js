"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Module_1 = require("../core/Module");
module.exports = new Module_1.Module((bot, global) => {
    console.log("M1 INIT");
    bot.on("Message", (sender, msg) => {
        if (msg.message.indexOf(sender.me.name) != -1) {
            msg.reply(msg.from.name + " Hi");
        }
    });
}, () => {
    console.log("M1 UNLOAD");
});
//# sourceMappingURL=module1.js.map