"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
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
            console.log(this.parsed.channel);
            if (this.parsed.channel.test(target[j].name)) {
                allowedRun = true;
            }
        }
        if (allowedRun && this.parsed.endpoint.test(event.endpoint.name)) {
            console.log(this.parsed.endpoint);
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
    async canCommandExecute(event) {
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
                        let result = await message.target.userHasRole(message.from, this.authValue);
                        return result;
                    }
                }
                break;
        }
        return false;
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
    static Deserialize(jsonObject) {
        return new Command(jsonObject.name, (typeof jsonObject.fnc === "string" ?
            new AsyncFunction("bot", "message", "require", jsonObject.fnc.replace(/^async function\s+anonymous\(bot,message,require\s*\)\s*{\s*(.*)\s*}$/s, "$1"))
            :
                jsonObject.fnc), new CommandThrottleOptions(jsonObject.throttle.user, jsonObject.throttle.channel, jsonObject.throttle.endpoint), jsonObject.binding.map(p => new CommandBindOptions(p.binding)), jsonObject.auth.map(p => new CommandAuthOptions(p.authType, p.authValue)), jsonObject.serialize, jsonObject.requireCommandPrefix);
    }
    async execute(bot, message) {
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
            console.log("true 2prime");
            if (res) {
                console.log("true 2primeprime");
                if (this.auth.length > 0) {
                    console.log("true 2primeprimeprime");
                    return new Promise(async (resolve) => {
                        console.log("true2");
                        let values = await Promise.all(this.auth.map(p => p.canCommandExecute(message)));
                        if (values.filter(b => b == true).length > 0) {
                            console.log("true2a");
                            updateTs();
                            await this.fnc(bot, message, require);
                            resolve(true);
                        }
                        resolve(false);
                    });
                }
                else {
                    console.log("false 2primeprime");
                    return new Promise(async (resolve) => {
                        console.log("true1a");
                        updateTs();
                        await this.fnc(bot, message, require);
                        console.log("true1b");
                        resolve(true);
                    });
                }
            }
        }
        return new Promise((resolve) => {
            console.log("false1");
            resolve(false);
        });
    }
    toJSON() {
        return {
            name: this.name,
            fnc: this.fnc.toString(),
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
exports.EndpointTimestampCollection = EndpointTimestampCollection;
//# sourceMappingURL=Command.js.map