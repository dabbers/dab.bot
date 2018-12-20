"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TestUser {
    say(message) {
        throw new Error("Method not implemented.");
    }
    action(message) {
        throw new Error("Method not implemented.");
    }
    constructor(overrideMthds) {
        for (let m in overrideMthds) {
            this[m] = overrideMthds[m];
        }
    }
}
exports.TestUser = TestUser;
//# sourceMappingURL=TestUser.js.map