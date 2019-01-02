"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Module_1 = require("../core/Module");
const EndpointTypes_1 = require("../core/EndpointTypes");
module.exports = new Module_1.Module((bot, global) => {
    setInterval(() => {
        let key = Object.keys(bot.endpoints).filter(p => bot.endpoints[p].type == EndpointTypes_1.EndpointTypes.IRC);
        if (key && key.length > 0) {
            bot.endpoints[key[0]].say("#dab.beta", "testing");
        }
    }, 3000);
}, () => {
    console.log("M1 UNLOAD");
});
//# sourceMappingURL=timertest.js.map