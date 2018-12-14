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

export class TelegramMessage implements IMessage {
    constructor(endpoint:TelegramEndpoint, message:Telegram.ContextMessageUpdate) {
        this.endpoint = endpoint;
        this.msg = message;
    }

    get message(): string {
        return this.msg.message.text;
    }
    get from(): IUser {
        return new TelegramUser(this.endpoint, this.msg.from);
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
        this.msg.reply(message);
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

    get discriminator() : string {
        return "TelegramMessage";
    }
}

export class TelegramUser implements IUser {
    constructor(endpoint:TelegramEndpoint, user:User) {
        this.endpoint = endpoint;
        this.user = user;
    }
    get name(): string {
        return this.user.first_name;
    }

    discriminator: "CORE.IUser";
    say(message: string): void {
        this.endpoint.client.telegram.sendMessage(this.user.id, message);
    }
    action(message: string): void {
        this.say("*"+message+"*");
    }
    user:User;
    endpoint:TelegramEndpoint;
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
    discriminator: "CORE.IChannel";
    endpoint: TelegramEndpoint;
    chann:Telegram.ContextMessageUpdate;
}

export class TelegramEndpoint extends EventEmitter implements IEndpoint {
    get type() : EndpointTypes {
        return EndpointTypes.Telegram;
    }

    get name() : string {
        return this.config.name || this.type.toString();
    }
    constructor(options:EndpointConfig) {
        super();

        this.config = options;
    }

    connect(): void {
        console.log("telegram");
        this.client = new Telegraf(this.config.connectionString[0]);

        this.client.on('connected_website', () => {
            // this.client.telegram.getChatMembersCount
            this.client.telegram.getMe().then((botInfo) => {
                console.log("TELEGRAM ME:" + JSON.stringify(botInfo));

                this.me = new TelegramUser(this, botInfo);
                this.emit(EndpointEvents.Connected.toString(), this, this.me);
              }, (reason) => {
                  console.log("TELEGRAM ME ERROR: " + JSON.stringify(reason));
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
                  console.log("TELEGRAM ME ERROR: " + JSON.stringify(reason));
            });
        });      
    }
    disconnect(): void {
        throw new Error("Method not implemented.");
    }
    isConnected: boolean;
    join(channel: string | IChannel, key: string): void {
        throw new Error("Method not implemented.");
    }
    part(channel: string | IChannel): void {
        throw new Error("Method not implemented.");
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
    
    me: IUser
    client:Telegram.Telegraf<Telegram.ContextMessageUpdate>;
    config:EndpointConfig
}