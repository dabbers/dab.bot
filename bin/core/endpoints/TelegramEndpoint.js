"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EndpointTypes_1 = require("../EndpointTypes");
const IEndpoint_1 = require("../IEndpoint");
const events_1 = require("events");
const telegraf_1 = require("telegraf");
class TelegramMessage {
    constructor(endpoint, message) {
        this.endpoint = endpoint;
        this.msg = message;
        this.fromUser = new TelegramUser(this.endpoint, this.msg.from);
    }
    get message() {
        return this.msg.message.text;
    }
    get from() {
        return this.fromUser;
    }
    get isDirectMessage() {
        return this.msg.chat.type == "private";
    }
    get target() {
        if (this.isDirectMessage) {
            return this.endpoint.me;
        }
        else {
            return new TelegramChannel(this.endpoint, this.msg);
        }
    }
    reply(message) {
        this.msg.reply(message, { "reply_to_message_id": this.msg.message.message_id });
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
        return "TelegramMessage";
    }
    toString() {
        return "[" + this.discriminator + " Message]";
    }
}
exports.TelegramMessage = TelegramMessage;
class TelegramUser {
    constructor(endpoint, user) {
        this.discriminator = "CORE.TelegramUser";
        this.endpoint = endpoint;
        this.user = user;
    }
    get account() {
        return this.user.username.toString();
    }
    get name() {
        return this.user.first_name;
    }
    say(message) {
        this.endpoint.client.telegram.sendMessage(this.user.id, message);
    }
    action(message) {
        this.say("*" + message + "*");
    }
    toString() {
        return "[" + this.name + " " + this.discriminator + " User]";
    }
}
exports.TelegramUser = TelegramUser;
class TelegramChannel {
    constructor(endpoint, chann) {
        this.discriminator = "CORE.TelegramChannel";
        this.endpoint = endpoint;
        this.chann = chann;
        this.name = this.chann.chat.id.toString();
    }
    say(message) {
        this.chann.reply(message);
    }
    action(message) {
        this.say("*" + message + "*");
    }
    part() {
        throw new Error("Method not implemented.");
    }
    userHasRole(user, role) {
        return new Promise((resolve, reject) => {
            if (role.toLocaleLowerCase().indexOf("admin") !== 0) {
                return resolve(false);
            }
            this.chann.getChatAdministrators().then((v) => {
                return resolve(v.filter(member => member.user.id.toString() == user.account).length > 0);
            });
        });
    }
    toString() {
        return "[" + this.name + " " + this.discriminator + " Channel]";
    }
}
exports.TelegramChannel = TelegramChannel;
class TelegramEndpoint extends events_1.EventEmitter {
    get type() {
        return EndpointTypes_1.EndpointTypes.Telegram;
    }
    get name() {
        return this.config.name || this.type.toString();
    }
    constructor(options, authBot) {
        super();
        this.config = options;
        this.authBot = authBot;
        this.me = { "name": "??", discriminator: "IUser", account: "??", action: () => true, say: () => true };
    }
    connect() {
        console.log("telegram");
        this.client = new telegraf_1.default(this.config.connectionString[0]);
        // Need to understand if this is needed when using polling.
        this.client.on('connected_website', () => {
            this.client.telegram.getMe().then((botInfo) => {
                this.me = new TelegramUser(this, botInfo);
                this.emit(IEndpoint_1.EndpointEvents.Connected.toString(), this, this.me);
            }, (reason) => {
                console.error("TELEGRAM ME ERROR: " + JSON.stringify(reason));
            });
        });
        this.client.on('text', (ctx) => {
            let msg = new TelegramMessage(this, ctx);
            this.emit(IEndpoint_1.EndpointEvents.Message.toString(), this, msg);
        });
        this.client.telegram.deleteWebhook().then(() => {
            this.client.startPolling();
        }).then(() => {
            // this.client.telegram.getChatMembersCount
            this.client.telegram.getMe().then((botInfo) => {
                this.me = new TelegramUser(this, botInfo);
                this.emit(IEndpoint_1.EndpointEvents.Connected.toString(), this, this.me);
            }, (reason) => {
                console.error("TELEGRAM ME ERROR: " + JSON.stringify(reason));
            });
        });
    }
    disconnect() {
        throw new Error("Cannot disconnect from telegram.");
    }
    get isConnected() {
        return true; // Technically, we're never offline?
    }
    join(channel, key) {
        throw new Error("Cannot join channels from telegram.");
    }
    part(channel) {
        if (typeof channel === "string") {
            this.client.telegram.leaveChat(channel);
        }
        else {
            this.client.telegram.leaveChat(channel.name);
        }
    }
    say(destination, message) {
        if (typeof destination === "string") {
            this.client.telegram.sendMessage(destination, message);
        }
    }
    action(destination, message) {
        throw new Error("Method not implemented.");
    }
    send(msg) {
        throw new Error("Method not implemented.");
    }
    toString() {
        return "[" + this.name + " TelegramEndpoint Endpoint]";
    }
}
exports.TelegramEndpoint = TelegramEndpoint;
//# sourceMappingURL=TelegramEndpoint.js.map