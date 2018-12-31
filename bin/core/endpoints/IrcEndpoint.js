"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EndpointTypes_1 = require("../EndpointTypes");
const IEndpoint_1 = require("../IEndpoint");
const events_1 = require("events");
const IRC = require("irc-framework");
class IrcMessage {
    constructor(ep, from, target, message) {
        this.message = message;
        this.from = from;
        this.target = target;
        this.isDirectMessage = (target.discriminator.indexOf("User") > 0);
        this.endpoint = ep;
    }
    reply(message) {
        this.endpoint.say((this.isDirectMessage ? this.from : this.target), message);
    }
    action(message) {
        this.endpoint.action((this.isDirectMessage ? this.from : this.target), message);
    }
    notice(message) {
        this.endpoint.say((this.isDirectMessage ? this.from : this.target), message);
    }
    part() {
        if (!this.isDirectMessage) {
            this.endpoint.part(this.target);
        }
    }
    get discriminator() {
        return "CORE.IrcMessage";
    }
    toString() {
        return "[" + this.discriminator + " Message]";
    }
}
exports.IrcMessage = IrcMessage;
class GenericIrcUser {
}
class IrcUser {
    constructor(endpoint, user, ident, host, real, account) {
        this.discriminator = "CORE.IrcUser";
        this.endpoint = endpoint;
        if (typeof user === "string") {
            this.name = user;
            this.ident = ident;
            this.host = host;
            this.real = real;
            this.account = account;
        }
        else {
            if (ident)
                throw new Error("Cannot mix GenericUser with extra params");
            this.name = user.nick;
            this.ident = user.username;
            this.host = user.hostname;
            this.account = "";
            this.real = "";
        }
    }
    say(message) {
        this.endpoint.say(this, message);
    }
    action(message) {
        this.endpoint.action(this, message);
    }
    toString() {
        return "[" + this.name + " " + this.discriminator + " User]";
    }
}
exports.IrcUser = IrcUser;
class IrcChannel {
    constructor(endpoint, name, topic, user) {
        this.discriminator = "CORE.IrcChannel";
        this.endpoint = endpoint;
        this.name = name;
        this.topic = topic;
        this.users = user;
    }
    say(message) {
        this.endpoint.say(this, message);
    }
    action(message) {
        this.endpoint.action(this, message);
    }
    part() {
        this.endpoint.part(this);
    }
    userHasRole(user, role) {
        return new Promise((resolve, reject) => {
            resolve(false);
        });
    }
    toString() {
        return "[" + this.name + " " + this.discriminator + " Channel]";
    }
}
exports.IrcChannel = IrcChannel;
class IrcEndpoint extends events_1.EventEmitter {
    get me() {
        return new IrcUser(this, this.client.user.nick, this.client.user.username, this.client.user.host, "");
    }
    constructor(options, authBot) {
        super();
        this.config = options || null;
        this.client = new IRC.Client();
        this.authBot = authBot;
    }
    say(destination, message) {
        let msgParts = message.split("\n");
        let dst = "";
        if (typeof destination === "string") {
            dst = destination;
        }
        else {
            dst = destination.name;
        }
        this.client.say(dst, msgParts[0]);
        for (let i = 1; i < msgParts.length; i++) {
            this.client.say(dst, "" + msgParts[i]);
        }
    }
    action(destination, message) {
        if (typeof destination === "string") {
            this.client.action(destination, message);
        }
        else {
            this.client.action(destination.name, message);
        }
    }
    raw(message) {
        this.client.raw(message);
    }
    send(message) {
        this.say(message.target, message.message);
    }
    get type() {
        return EndpointTypes_1.EndpointTypes.IRC;
    }
    get name() {
        return this.config.name || this.type.toString();
    }
    connect() {
        console.log("IRC Connect");
        this.client = new IRC.Client();
        if (!this.config) {
            throw new Error("Options are required");
        }
        let randomIndex = Math.floor(Math.random() * (this.config.connectionString.length));
        let uri = this.config.connectionString[randomIndex].split(":");
        this.client.connect({
            host: uri[0],
            port: uri[1],
            nick: this.config.nickname,
            username: this.config.nickname,
            name: this.config.name,
            auto_reconnect: true
        });
        this.client.on('registered', () => {
            console.log('Connected!');
            this.client.join('#dab.beta');
            this.emit(IEndpoint_1.EndpointEvents.Connected.toString(), this, this.me);
        });
        this.client.on('close', () => {
            console.log('Connection close');
            this.emit(IEndpoint_1.EndpointEvents.Disconnected.toString(), this, this.me);
        });
        this.client.on('message', (event) => {
            let msg = new IrcMessage(this, new IrcUser(this, event), (event.target[0] == "#" ? new IrcChannel(this, event.target) : this.me), event.message);
            this.emit(IEndpoint_1.EndpointEvents.Message.toString(), this, msg);
        });
        this.client.matchMessage(/^!hi/, (event) => {
            event.reply('sup');
        });
        this.client.on('whois', (event) => {
            // console.log(event);
        });
        this.client.on('join', (event) => {
            // console.log('user joined', event);
        });
        this.client.on('part', (event) => {
            // console.log('user part', event);
        });
    }
    disconnect() {
        this.client.quit();
    }
    get isConnected() {
        return this.client.connected;
    }
    ;
    join(channel, key) {
        if (typeof channel === "string") {
            this.client.join(channel);
        }
        else {
            this.client.join(channel.name);
        }
    }
    part(channel) {
        if (typeof channel === "string") {
            this.client.part(channel);
        }
        else {
            this.client.part(channel.name);
        }
    }
    toString() {
        return "[" + this.name + " Endpoint]";
    }
}
exports.IrcEndpoint = IrcEndpoint;
//# sourceMappingURL=IrcEndpoint.js.map