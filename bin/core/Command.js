"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CommandThrottleOptions {
    constructor() {
        this.user = -1;
        this.channel = -1;
        this.endpoint = -1;
    }
    canCommandExecute(lastUser, lastChannel, lastEndpoint) {
        let canRun = true;
        let now = new Date();
        now.setSeconds(now.getSeconds() + this.user);
        if (this.user != -1 && lastUser != null) {
            if (now > lastUser) {
                canRun = false;
            }
        }
        now = new Date();
        now.setSeconds(now.getSeconds() + this.channel);
        if (this.channel != -1 && lastChannel != null) {
            if (now > lastChannel) {
                canRun = false;
            }
        }
        now = new Date();
        now.setSeconds(now.getSeconds() + this.endpoint);
        if (this.endpoint != -1 && lastEndpoint != null) {
            if (now > lastEndpoint) {
                canRun = false;
            }
        }
        return canRun;
    }
}
exports.CommandThrottleOptions = CommandThrottleOptions;
class ParsedEndpointBinding {
}
class CommandBindOptions {
    canCommandExecute(event) {
        let canRun = true;
        let target = (event.discriminator.indexOf("Leave") != -1) ? event.target : [event.target];
        for (let i in this.parsed) {
            for (let j in target) {
                if (!this.parsed[i].channel.test(j)) {
                    canRun = false;
                }
            }
            if (!this.parsed[i].endpoint.test(event.endpoint.name)) {
                canRun = false;
            }
        }
        return canRun;
    }
}
exports.CommandBindOptions = CommandBindOptions;
class Command {
    get name() {
        return this._name;
    }
    execute(message) {
        this.fnc(message);
        return message.endpoint;
    }
}
exports.Command = Command;
//# sourceMappingURL=Command.js.map