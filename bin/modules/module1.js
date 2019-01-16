"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports.create = (modType) => {
    return new modType((bot, config) => {
        console.log("M1 INIT");
        bot.on("Message", (sender, msg) => {
            if (msg.message.indexOf(sender.me.name) != -1) {
                msg.reply(msg.from.name + " Hi");
            }
        });
    }, () => {
        console.log("M1 UNLOAD");
    });
};
//# sourceMappingURL=module1.js.map