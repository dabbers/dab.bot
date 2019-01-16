"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class OnConnectCommandConfig {
}
class OnConnectConfig {
}
module.exports.create = (modType) => {
    return new modType((bot, config) => {
        if (!config || !config.commands) {
            throw new Error("Must provide commands to execute");
        }
        bot.on("Connected", (sender) => {
            for (let cmd of config.commands) {
                if (!cmd.command || (cmd.command != "join" && cmd.command != "say" && cmd.command != "part" && cmd.command != "raw") || !cmd.args || !Array.isArray(cmd.args)) {
                    throw new Error("Expected command structure of cmd.command (join, part, say) and cmd.args string:[]");
                }
                sender[cmd.command].apply(sender, cmd.args);
            }
        });
    }, () => {
        console.log("ONCONNECT UNLOAD");
    });
};
//# sourceMappingURL=onconnect.js.map