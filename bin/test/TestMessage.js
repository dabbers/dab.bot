"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TestEndpoint_1 = require("./TestEndpoint");
class TestMessage {
    constructor(overrideMthds, endpoint) {
        this.discriminator = "TestMessage";
        for (let m in overrideMthds) {
            this[m] = overrideMthds[m];
        }
        if (!endpoint) {
            endpoint = new TestEndpoint_1.TestEndpoint({});
        }
        this.endpoint = endpoint;
    }
    reply(message) {
        throw new Error("Method not implemented.");
    }
    action(message) {
        throw new Error("Method not implemented.");
    }
    notice(message) {
        throw new Error("Method not implemented.");
    }
    part() {
        throw new Error("Method not implemented.");
    }
}
exports.TestMessage = TestMessage;
//# sourceMappingURL=TestMessage.js.map