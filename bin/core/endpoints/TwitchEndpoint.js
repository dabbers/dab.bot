"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EndpointTypes_1 = require("../EndpointTypes");
const IEndpoint_1 = require("../IEndpoint");
const events_1 = require("events");
const twitch = require("tmi.js");
class TwitchMessage {
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
exports.TwitchMessage = TwitchMessage;
class TwitchUser {
    constructor(endpoint, display, username, id) {
        this.discriminator = "CORE.IrcUser";
        this.endpoint = endpoint;
        this.name = display;
        this.username = username;
        this.account = id;
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
exports.TwitchUser = TwitchUser;
class TwitchChannel {
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
exports.TwitchChannel = TwitchChannel;
class TwitchEndpoint extends events_1.EventEmitter {
    get me() {
        return new TwitchUser(this, this.config.nickname, this.config.nickname, "");
    }
    constructor(options, authBot) {
        super();
        this.config = options || null;
        this.client = new twitch.Client();
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
        console.log("Twitch Connect");
        if (!this.config) {
            throw new Error("Options are required");
        }
        var options = {
            options: {
                debug: true,
                clientId: this.config.connectionString[0]
            },
            connection: {
                reconnect: true
            },
            identity: {
                username: this.config.nickname,
                password: this.config.password
            }
        };
        this.client = new twitch.client();
        this.client.on('registered', () => {
            console.log('Connected!');
            if (this.config.channels) {
                for (let chan of this.config.channels) {
                    this.client.join(chan.name, chan.password);
                }
            }
            this.emit(IEndpoint_1.EndpointEvents.Connected.toString(), this, this.me);
        });
        this.client.on('close', () => {
            console.log('Connection close');
            this.emit(IEndpoint_1.EndpointEvents.Disconnected.toString(), this, this.me);
        });
        this.client.on("chat", function (channel, userstate, message, self) {
            // Don't listen to my own messages..
            if (self)
                return;
            let msg = new TwitchMessage(this, new TwitchUser(this, message["display-name"], message.username, message["user-id"]), (channel[0] == "#" ? new TwitchChannel(this, channel) : this.me), message);
            this.emit(IEndpoint_1.EndpointEvents.Message.toString(), this, msg);
            this.authBot.onMessage(this, msg);
        });
        this.client.on('message', (event) => {
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
        this.client.connect();
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
            this.client.join(channel, key);
        }
        else {
            this.client.join(channel.name, key);
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
exports.TwitchEndpoint = TwitchEndpoint;
//# sourceMappingURL=TwitchEndpoint.js.map