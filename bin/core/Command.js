"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class CommandThrottleOptions {
    constructor(user, channel, endpoint) {
        this.user = -1;
        this.channel = -1;
        this.endpoint = -1;
        this.user = user;
        this.channel = channel;
        this.endpoint = endpoint;
    }
    canCommandExecute(lastUser, lastChannel, lastEndpoint) {
        let canRun = true;
        let now = new Date();
        if (this.user != -1 && lastUser != null) {
            let throttleExpiration = new Date(lastUser);
            throttleExpiration.setSeconds(throttleExpiration.getSeconds() + this.user);
            if (now.getTime() <= throttleExpiration.getTime()) {
                canRun = false;
            }
        }
        if (this.channel != -1 && lastChannel != null) {
            let throttleExpiration = new Date(lastChannel);
            throttleExpiration.setSeconds(throttleExpiration.getSeconds() + this.channel);
            if (now.getTime() <= throttleExpiration.getTime()) {
                canRun = false;
            }
        }
        if (this.endpoint != -1 && lastEndpoint != null) {
            let throttleExpiration = new Date(lastEndpoint);
            throttleExpiration.setSeconds(throttleExpiration.getSeconds() + this.endpoint);
            if (now.getTime() <= throttleExpiration.getTime()) {
                canRun = false;
            }
        }
        return canRun;
    }
}
exports.CommandThrottleOptions = CommandThrottleOptions;
class ParsedEndpointBinding {
}
// Bind to a #channel@endpointName
class CommandBindOptions {
    constructor(binding) {
        this.binding = binding;
        let parts = this.binding.split("@");
        if (parts.length < 2) {
            throw new Error("Invalid endpoint binding passed: " + this.binding);
        }
        this.parsed = new ParsedEndpointBinding();
        this.parsed.channel = new RegExp(parts[0]);
        this.parsed.endpoint = new RegExp(parts[1]);
    }
    canCommandExecute(event) {
        let target = (event.discriminator.indexOf("Leave") != -1) ? event.target : [event.target];
        let allowedRun = false;
        for (let j in target) {
            if (this.parsed.channel.test(target[j].name)) {
                allowedRun = true;
            }
        }
        if (allowedRun && this.parsed.endpoint.test(event.endpoint.name)) {
            return true;
        }
        return false;
    }
    toJSON() {
        return { binding: this.binding };
    }
}
exports.CommandBindOptions = CommandBindOptions;
var CommandAuthTypes;
(function (CommandAuthTypes) {
    // Their service assigned account name. If they are not identified, their names are empty.
    CommandAuthTypes["Account"] = "account";
    // Uses the built-in auth options. Levels 1-3. All users are level 1 by default. Admin/owner is level 3.
    CommandAuthTypes["Level"] = "level";
    // The "visual" name of the user. NOT SECURE, but easy to validated
    CommandAuthTypes["Name"] = "name";
    // The assigned role of the user.
    CommandAuthTypes["Role"] = "role";
})(CommandAuthTypes = exports.CommandAuthTypes || (exports.CommandAuthTypes = {}));
class CommandAuthOptions {
    constructor(authType, authValue) {
        this.authType = authType;
        this.authValue = authValue;
        // Due to membership lookup code, we cannot perform regex on roles.
        if (this.authType != CommandAuthTypes.Role) {
            this.authValueRegex = new RegExp(this.authValue);
        }
    }
    canCommandExecute(event) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (this.authType) {
                case CommandAuthTypes.Account:
                    return this.authValueRegex.test(event.from.account);
                case CommandAuthTypes.Level:
                    return this.authValueRegex.test(event.endpoint.authBot.isUserAuthed(event).toString());
                case CommandAuthTypes.Name:
                    return this.authValueRegex.test(event.from.name);
                case CommandAuthTypes.Role:
                    // Role auth options are only valid in channel messages= events
                    let isMessage = (event.discriminator.indexOf("Message") > 0);
                    if (isMessage) {
                        let message = event;
                        if (!message.isDirectMessage) {
                            let result = yield message.target.userHasRole(message.from, this.authValue);
                            return result;
                        }
                    }
                    break;
            }
            return false;
        });
    }
    toJSON() {
        return { authType: this.authType, authValue: this.authValue };
    }
}
exports.CommandAuthOptions = CommandAuthOptions;
class Command {
    constructor(name, fnc, throttle, binding, auths, serialize = true, requireCommandPrefix = true) {
        this._name = name;
        this.throttle = throttle;
        this.binding = binding;
        this.auth = auths;
        this.fnc = fnc;
        this.lastUser = new Map();
        this.lastEndpoint = new Map();
        this.serialize = serialize;
        this.requireCommandPrefix = requireCommandPrefix;
    }
    get name() {
        return this._name;
    }
    execute(bot, message) {
        return __awaiter(this, void 0, void 0, function* () {
            // Since we have 2 ways to execute our fnc, we need to update the timestamp in 2 places.
            // This is nice and easy code sharing.
            let updateTs = () => {
                // Update their last used timestamp
                let latest = new Date();
                this.lastUser.set(message.from, latest);
                this.lastEndpoint.get(message.endpoint).updateTimestamp(message, latest);
            };
            let le = this.lastEndpoint.get(message.endpoint);
            if (le == null) {
                le = new EndpointTimestampCollection();
                this.lastEndpoint.set(message.endpoint, le);
            }
            let lastChan = null;
            if (message.discriminator.indexOf("Message") > 0 && message.target.discriminator.indexOf("Channel") > 0) {
                lastChan = le.lastChannel.get(message.target);
            }
            if (this.throttle.canCommandExecute(this.lastUser.get(message.from), lastChan, le.lastEndpoint)) {
                let res = (this.binding.length > 0 ?
                    this.binding.filter(b => b.canCommandExecute(message) === true).length > 0
                    : true);
                if (res) {
                    if (this.auth.length > 0) {
                        let res = yield Promise.all(this.auth.map(p => p.canCommandExecute(message))).then((values) => {
                            if (values.filter(b => b == true).length > 0) {
                                updateTs();
                                this.fnc(bot, message);
                                return true;
                            }
                            return false;
                        }).catch(p => {
                            console.error("Command.ts error: ", p);
                            throw p;
                        });
                        return res;
                    }
                    else {
                        updateTs();
                        this.fnc(bot, message);
                        return true;
                    }
                }
            }
            return false;
        });
    }
    toJSON() {
        return {
            name: this.name,
            fnc: this.fnc,
            throttle: this.throttle,
            binding: this.binding,
            auth: this.auth,
            serialize: this.serialize,
            requireCommandPrefix: this.requireCommandPrefix
        };
    }
    toString() {
        return "[" + this.name + " Command]";
    }
}
exports.Command = Command;
class EndpointTimestampCollection {
    constructor() {
        this.lastChannel = new Map();
        this.lastEndpoint = null;
    }
    updateTimestamp(event, latest) {
        if (event.discriminator.indexOf("Message") > 0) {
            this.lastChannel.set(event.target, latest);
        }
        this.lastEndpoint = latest;
    }
}
//# sourceMappingURL=Command.js.map