"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EndpointTypes_1 = require("../EndpointTypes");
const IEndpoint_1 = require("../IEndpoint");
const events_1 = require("events");
const builder = require("botbuilder");
const botbuilder_1 = require("botbuilder");
class BotFrameworkMessage {
    constructor(endpoint, context) {
        this.endpoint = endpoint;
        this.context = context;
        let r = builder.TurnContext.getConversationReference(this.context.activity);
        this.user = new BotFrameworkUser(this.endpoint, this.context.activity.from, r);
    }
    get message() {
        return this.context.activity.text;
    }
    get from() {
        return this.user;
    }
    get isDirectMessage() {
        return !this.context.activity.conversation.isGroup;
    }
    get target() {
        if (this.isDirectMessage) {
            return this.endpoint.me;
        }
        else {
            let t = botbuilder_1.TurnContext.getConversationReference(this.context.activity);
            return new BotFrameworkChannel(this.endpoint, t);
        }
    }
    async reply(message) {
        return this.context.sendActivity(message);
    }
    async action(message) {
        return this.context.sendActivity(message);
    }
    async notice(message) {
        return this.context.sendActivity(message);
    }
    part() {
        throw new Error("Method not implemented.");
    }
    get discriminator() {
        return "CORE.BotFrameworkMessage";
    }
}
exports.BotFrameworkMessage = BotFrameworkMessage;
class BotFrameworkUser {
    constructor(endpoint, user, convo) {
        this.discriminator = "CORE.BotFrameworkUser";
        // this.user = user;
        this.endpoint = endpoint;
        this.convo = convo;
        this.user = user;
    }
    get name() {
        return this.user.name;
    }
    get account() {
        return this.user.id;
    }
    async say(message) {
        return this.endpoint.adapter.createConversation(this.convo, async (c) => {
            try {
                await c.sendActivity(message);
            }
            catch (ex) {
                console.error(ex);
            }
        });
    }
    async action(message) {
        return this.endpoint.adapter.createConversation(this.convo, async (c) => {
            try {
                await c.sendActivity(message);
            }
            catch (ex) {
                console.error(ex);
            }
        });
    }
}
exports.BotFrameworkUser = BotFrameworkUser;
class BotFrameworkChannel {
    constructor(endpoint, chann) {
        this.discriminator = "CORE.BotFrameworkChannel";
        this.endpoint = endpoint;
        this.chann = chann;
    }
    get name() {
        return this.chann.conversation.name;
    }
    async say(message) {
        return this.endpoint.adapter.continueConversation(this.chann, async (c) => {
            await c.sendActivity(message);
        });
    }
    async action(message) {
        return this.endpoint.adapter.continueConversation(this.chann, async (c) => {
            await c.sendActivity(message).catch(r => console.error(r));
        });
    }
    part() {
        throw new Error("Method not implemented.");
    }
    userHasRole(user, role) {
        return new Promise((resolve, reject) => {
            resolve(false);
        });
    }
}
exports.BotFrameworkChannel = BotFrameworkChannel;
class BotFrameworkEndpoint extends events_1.EventEmitter {
    get type() {
        return EndpointTypes_1.EndpointTypes.BotFramework;
    }
    get name() {
        return this.config.name || this.type.toString();
    }
    constructor(options, authBot) {
        super();
        this.config = options;
        this.authBot = authBot;
        this.on("BotFwAPI", (req, res) => {
            res.status = () => { };
            this.adapter.processActivity(req, res, async (context) => {
                // Do something with this incoming activity!
                try {
                    this.meUser = new BotFrameworkUser(this, context.activity.recipient, null);
                    // await context.sendActivity("HELLO!!!");
                    console.log("BFE1");
                    let msg = new BotFrameworkMessage(this, context);
                    console.log("BFE2");
                    this.emit(IEndpoint_1.EndpointEvents.Message.toString(), this, msg);
                    await this.authBot.onMessage(this, msg);
                }
                catch (ex) {
                    console.error(ex);
                }
            });
        });
    }
    connect() {
        this.adapter = new builder.BotFrameworkAdapter({ appId: this.config.connectionString[0], appPassword: this.config.connectionString[1] });
    }
    disconnect() {
        throw new Error("Method not implemented.");
    }
    get isConnected() {
        // return this.client.status != 5; // 5 == disconnected
        return true;
    }
    join(channel, key) {
        throw new Error("Method not implemented.");
    }
    part(channel) {
        throw new Error("Method not implemented.");
    }
    say(destination, message) {
        if (typeof destination === "string") {
            // let chan = (<BotFramework.TextChannel>this.client.channels.get(destination));
            // if (!chan) {
            //     // chan = (<BotFramework.TextChannel>this.client.channels.filter( (v, k, col) => (<BotFramework.TextChannel>v).name == destination).first());
            //     if (!chan) throw new Error("Cannot find channel " + destination);
            // }
            // this.adapter.createConversation()
        }
        else {
            // let dest = null;
            // // destination HAS to be a BotFramework channel or user
            // if (destination.discriminator.indexOf("Channel") > 0) {
            //     let t = <BotFrameworkChannel>destination;
            //     // dest = (<BotFramework.TextChannel>this.client.channels.get(t.chann.id));
            // }
            // else {
            //     let t = <BotFrameworkUser>destination;
            //     // dest = this.client.users.get(t.user.id);
            // }
            // dest.send(message);
        }
    }
    action(destination, message) {
        this.say(destination, "*" + message + "*");
    }
    send(msg) {
        this.say(msg.target, msg.message);
    }
    get me() {
        return this.meUser;
    }
    async emitAsync(...args) {
        return new Promise(res => {
            this.emit.apply(this, args);
            res();
        });
    }
}
exports.BotFrameworkEndpoint = BotFrameworkEndpoint;
//# sourceMappingURL=BotFrameworkEndpoint.js.map