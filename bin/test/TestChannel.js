"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TestChannel {
    constructor(overrideMthds) {
        this.discriminator = "CORE.IChannel";
        for (let m in overrideMthds) {
            this[m] = overrideMthds[m];
        }
    }
    say(message) {
        throw new Error("Method not implemented.");
    }
    action(message) {
        throw new Error("Method not implemented.");
    }
    part() {
        throw new Error("Method not implemented.");
    }
    userHasRole(user, role) {
        throw new Error("Method not implemented.");
    }
}
exports.TestChannel = TestChannel;
//# sourceMappingURL=TestChannel.js.map