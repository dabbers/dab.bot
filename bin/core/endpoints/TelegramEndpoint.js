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
    }
    get message() {
        return this.msg.message.text;
    }
    get from() {
        return new TelegramUser(this.endpoint, this.msg.from);
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
        return "TelegramMessage";
    }
}
exports.TelegramMessage = TelegramMessage;
class TelegramUser {
    constructor(endpoint, user) {
        this.endpoint = endpoint;
        this.user = user;
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
}
exports.TelegramUser = TelegramUser;
class TelegramChannel {
    constructor(endpoint, chann) {
        this.endpoint = endpoint;
        this.chann = chann;
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
}
exports.TelegramChannel = TelegramChannel;
class TelegramEndpoint extends events_1.EventEmitter {
    get type() {
        return EndpointTypes_1.EndpointTypes.Telegram;
    }
    get name() {
        return this.config.name || this.type.toString();
    }
    constructor(options) {
        super();
        this.config = options;
    }
    connect() {
        console.log("telegram");
        this.client = new telegraf_1.default(this.config.connectionString[0]);
        this.client.on('connected_website', () => {
            // this.client.telegram.getChatMembersCount
            this.client.telegram.getMe().then((botInfo) => {
                console.log("TELEGRAM ME:" + JSON.stringify(botInfo));
                this.me = new TelegramUser(this, botInfo);
                this.emit(IEndpoint_1.EndpointEvents.Connected.toString(), this, this.me);
            }, (reason) => {
                console.log("TELEGRAM ME ERROR: " + JSON.stringify(reason));
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
                console.log("TELEGRAM ME ERROR: " + JSON.stringify(reason));
            });
        });
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
}
exports.TelegramEndpoint = TelegramEndpoint;
//# sourceMappingURL=TelegramEndpoint.js.map