"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EndpointTypes_1 = require("../core/EndpointTypes");
class TestEndpoint {
    constructor(overrideMthds) {
        this.type = EndpointTypes_1.EndpointTypes.IRC;
        this.name = "TestEndpoint";
        for (let m in overrideMthds) {
            this[m] = overrideMthds[m];
        }
    }
    connect() {
        throw new Error("Method not implemented.");
    }
    disconnect() {
        throw new Error("Method not implemented.");
    }
    join(channel, key) {
        throw new Error("Method not implemented.");
    }
    part(channel) {
        throw new Error("Method not implemented.");
    }
    say(destination, message) {
        throw new Error("Method not implemented.");
    }
    action(destination, message) {
        throw new Error("Method not implemented.");
    }
    send(msg) {
        throw new Error("Method not implemented.");
    }
    addListener(event, listener) {
        throw new Error("Method not implemented.");
    }
    on(event, listener) {
        throw new Error("Method not implemented.");
    }
    once(event, listener) {
        throw new Error("Method not implemented.");
    }
    prependListener(event, listener) {
        throw new Error("Method not implemented.");
    }
    prependOnceListener(event, listener) {
        throw new Error("Method not implemented.");
    }
    removeListener(event, listener) {
        throw new Error("Method not implemented.");
    }
    removeAllListeners(event) {
        throw new Error("Method not implemented.");
    }
    setMaxListeners(n) {
        throw new Error("Method not implemented.");
    }
    getMaxListeners() {
        throw new Error("Method not implemented.");
    }
    listeners(event) {
        throw new Error("Method not implemented.");
    }
    rawListeners(event) {
        throw new Error("Method not implemented.");
    }
    emit(event, ...args) {
        throw new Error("Method not implemented.");
    }
    eventNames() {
        throw new Error("Method not implemented.");
    }
    listenerCount(type) {
        throw new Error("Method not implemented.");
    }
}
exports.TestEndpoint = TestEndpoint;
//# sourceMappingURL=TestEndpoint.js.map