import {EndpointTypes} from "../EndpointTypes";
import {IEndpoint} from '../IEndpoint';
import {EndpointEvents} from '../IEndpoint';
import {EventEmitter} from "events";
import {IChannel} from '../IChannel';
import {IUser} from '../IUser';
import {IMessage} from '../Events/IMessage';
import {IJoin} from '../Events/IJoin';
import {ILeave} from '../Events/ILeave';
import * as Telegram from 'telegraf';
import Telegraf from 'telegraf';
import { User } from 'telegram-typings'

import{EndpointConfig} from '../config/EndpointConfig';
import { DESTRUCTION } from "dns";
import { IAuthable } from "../IAuthable";
import { ExtraReplyMessage } from "telegraf/typings/telegram-types";

export class TelegramMessage implements IMessage {
    constructor(endpoint:TelegramEndpoint, message:Telegram.ContextMessageUpdate) {
        this.endpoint = endpoint;
        this.msg = message;
        this.fromUser = new TelegramUser(this.endpoint, this.msg.from);

        this.msg.getChatMember(this.msg.from.id).then((v) => {
            console.log("GET CHAT MEMBER TELEGRAM: ", v);
        });
    }

    get message(): string {
        return this.msg.message.text;
    }
    get from(): IUser {
        return this.fromUser;
    }
    get isDirectMessage(): boolean {
        return this.msg.chat.type == "private";
    }

    get target(): IUser | IChannel {
        if (this.isDirectMessage) {
            return this.endpoint.me
        } else {
            return new TelegramChannel(this.endpoint, this.msg);
        }
    }

    reply(message: string): void {
        this.msg.reply(message, <ExtraReplyMessage>{"reply_to_message_id": this.msg.message.message_id});
    }

    action(message: string): void {
        this.msg.reply("*" + message + "*");
    }

    notice(message: string): void {
        this.msg.reply("__**" + message + "**__");
    }

    part(): void {
        throw new Error("Method not implemented.");
    }

    endpoint: TelegramEndpoint;
    msg:Telegram.ContextMessageUpdate;
    fromUser:TelegramUser;

    get discriminator() : string {
        return "TelegramMessage";
    }

    toString() : string {
        return "[" + this.discriminator + " Message]";
    }
}

export class TelegramUser implements IUser {
    constructor(endpoint:TelegramEndpoint, user:User) {
        this.endpoint = endpoint;
        this.user = user;
    }

    get account() : string {
        return this.user.id.toString();
    }

    get name(): string {
        return this.user.first_name;
    }

    discriminator:string = "CORE.TelegramUser";
    say(message: string): void {
        this.endpoint.client.telegram.sendMessage(this.user.id, message);
    }
    action(message: string): void {
        this.say("*"+message+"*");
    }
    user:User;
    endpoint:TelegramEndpoint;

    toString() : string {
        return "[" + this.name + " " + this.discriminator + " User]";
    }
}

export class TelegramChannel implements IChannel {
    constructor(endpoint:TelegramEndpoint, chann:Telegram.ContextMessageUpdate) {
        this.endpoint = endpoint;
        this.chann = chann;
    }

    users: { [key: string]: IUser; };
    topic: string;
    name: string;
    say(message: string): void {
        this.chann.reply(message);
    }

    action(message: string): void {
        this.say("*"+message+"*");
    }
    part(): void {
        throw new Error("Method not implemented.");
    }
    
    userHasRole(user:IUser, role:string):Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (role.toLocaleLowerCase().indexOf("admin") !== 0) {
                return resolve(false);
            }

            this.chann.getChatAdministrators().then( (v) => {
                return resolve(v.filter( member => member.user.id.toString() == user.account).length > 0);
            });
        });
    }

    discriminator:string = "CORE.TelegramChannel";
    endpoint: TelegramEndpoint;
    chann:Telegram.ContextMessageUpdate;

    toString() : string {
        return "[" + this.name + " " + this.discriminator + " Channel]";
    }
}

export class TelegramEndpoint extends EventEmitter implements IEndpoint {
    get type() : EndpointTypes {
        return EndpointTypes.Telegram;
    }

    get name() : string {
        return this.config.name || this.type.toString();
    }

    constructor(options:EndpointConfig, authBot:IAuthable) {
        super();

        this.config = options;
        this.authBot = authBot;
        this.me = {"name":"??", discriminator:"IUser", account:"??", action:()=>true, say: ()=>true};
    }

    connect(): void {
        console.log("telegram");
        this.client = new Telegraf(this.config.connectionString[0]);

        // Need to understand if this is needed when using polling.
        this.client.on('connected_website', () => {
            this.client.telegram.getMe().then((botInfo) => {
                this.me = new TelegramUser(this, botInfo);
                this.emit(EndpointEvents.Connected.toString(), this, this.me);
              }, (reason) => {
                  console.error("TELEGRAM ME ERROR: " + JSON.stringify(reason));
            });
        });

        this.client.on('text', (ctx) => {
            let msg = new TelegramMessage(this, ctx);
            this.emit(EndpointEvents.Message.toString(), this, msg);
        });

        (<any>this.client.telegram).deleteWebhook().then( () => {
            this.client.startPolling();
        }).then( () => {
            // this.client.telegram.getChatMembersCount
            this.client.telegram.getMe().then((botInfo) => {
                this.me = new TelegramUser(this, botInfo);
                this.emit(EndpointEvents.Connected.toString(), this, this.me);
              }, (reason) => {
                  console.error("TELEGRAM ME ERROR: " + JSON.stringify(reason));
            });
        });      
    }

    disconnect(): void {
        throw new Error("Cannot disconnect from telegram.");
    }

    get isConnected(): boolean {
        return true; // Technically, we're never offline?
    }

    join(channel: string | IChannel, key: string): void {
        throw new Error("Cannot join channels from telegram.");
    }
    part(channel: string | IChannel): void {
        if (typeof channel === "string") {
            this.client.telegram.leaveChat(channel);
        }
        else {
            this.client.telegram.leaveChat(channel.name);
        }
    }
    say(destination: string | IChannel | IUser, message: string): void {
        if (typeof destination === "string") {
            this.client.telegram.sendMessage(destination, message);
        }
    }
    action(destination: string | IChannel | IUser, message: string): void {
        throw new Error("Method not implemented.");
    }
    send(msg: IMessage): void {
        throw new Error("Method not implemented.");
    }

    toString() : string {
        return "[" + this.name + " TelegramEndpoint Endpoint]";
    }
    
    me: IUser
    client:Telegram.Telegraf<Telegram.ContextMessageUpdate>;
    config:EndpointConfig;
    authBot:IAuthable;
}
