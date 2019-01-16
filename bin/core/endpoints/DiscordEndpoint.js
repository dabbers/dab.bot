"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EndpointTypes_1 = require("../EndpointTypes");
const IEndpoint_1 = require("../IEndpoint");
const events_1 = require("events");
const Discord = require("discord.js");
class DiscordMessage {
    constructor(endpoint, message) {
        this.endpoint = endpoint;
        this.msg = message;
    }
    get message() {
        return this.msg.content;
    }
    get from() {
        return new DiscordUser(this.endpoint, this.msg.author);
    }
    get isDirectMessage() {
        return this.msg.channel.type == "dm";
    }
    get target() {
        if (this.isDirectMessage) {
            return this.endpoint.me;
        }
        else {
            return new DiscordChannel(this.endpoint, this.msg.channel);
        }
    }
    reply(message) {
        this.msg.reply(message);
    }
    action(message) {
        this.msg.reply("*" + message + "*");
    }
    notice(message) {
        this.msg.reply("__**" + message + "**__");
    }
    part() {
        throw new Error("Method not implemented.");
    }
    get discriminator() {
        return "CORE.DiscordMessage";
    }
}
exports.DiscordMessage = DiscordMessage;
class DiscordUser {
    constructor(endpoint, user) {
        this.discriminator = "CORE.DiscordUser";
        this.user = user;
        this.endpoint = endpoint;
    }
    get name() {
        return this.user.username;
    }
    get account() {
        return this.user.id;
    }
    say(message) {
        this.user.sendMessage(message);
    }
    action(message) {
        this.user.sendMessage("*" + message + "*");
    }
}
exports.DiscordUser = DiscordUser;
class DiscordChannel {
    constructor(endpoint, chann) {
        this.discriminator = "CORE.DiscordChannel";
        this.endpoint = endpoint;
        this.chann = chann;
    }
    get name() {
        return this.chann.name;
    }
    say(message) {
        this.chann.send(message);
    }
    action(message) {
        this.chann.send("*" + message + "*");
    }
    part() {
        throw new Error("Method not implemented.");
    }
    userHasRole(user, role) {
        return new Promise((resolve, reject) => {
            let users = this.chann.members.filter(p => p.id == user.account);
            if (!users || users.size == 0)
                return resolve(false);
            if (users.first().roles.size == 0)
                return resolve(false);
            resolve(users.first().roles.filter(p => p.name == role).size > 0);
        });
    }
}
exports.DiscordChannel = DiscordChannel;
class DiscordEndpoint extends events_1.EventEmitter {
    get type() {
        return EndpointTypes_1.EndpointTypes.Discord;
    }
    get name() {
        return this.config.name || this.type.toString();
    }
    constructor(options, authBot) {
        super();
        this.config = options;
        this.authBot = authBot;
    }
    connect() {
        console.log("discord connect");
        this.client = new Discord.Client();
        this.client.on('ready', () => {
            this.emit(IEndpoint_1.EndpointEvents.Connected.toString(), this, this.me);
        });
        this.client.on('message', msg => {
            let msg2 = new DiscordMessage(this, msg);
            this.emit(IEndpoint_1.EndpointEvents.Message.toString(), this, msg2);
        });
        this.client.login(this.config.connectionString[0]);
    }
    disconnect() {
        throw new Error("Method not implemented.");
    }
    get isConnected() {
        return this.client.status != 5; // 5 == disconnected
    }
    join(channel, key) {
        throw new Error("Method not implemented.");
    }
    part(channel) {
        throw new Error("Method not implemented.");
    }
    say(destination, message) {
        if (typeof destination === "string") {
            let chan = this.client.channels.get(destination);
            if (!chan) {
                chan = this.client.channels.filter((v, k, col) => v.name == destination).first();
                if (!chan)
                    throw new Error("Cannot find channel " + destination);
            }
            chan.send(message);
        }
        else {
            let dest = null;
            // destination HAS to be a discord channel or user
            if (destination.discriminator.indexOf("Channel") > 0) {
                let t = destination;
                dest = this.client.channels.get(t.chann.id);
            }
            else {
                let t = destination;
                dest = this.client.users.get(t.user.id);
            }
            dest.send(message);
        }
    }
    action(destination, message) {
        this.say(destination, "*" + message + "*");
    }
    send(msg) {
        this.say(msg.target, msg.message);
    }
    get me() {
        return new DiscordUser(this, this.client.user);
    }
}
exports.DiscordEndpoint = DiscordEndpoint;
//# sourceMappingURL=DiscordEndpoint.js.map