import {EndpointTypes} from "../EndpointTypes";
import {IEndpoint} from '../IEndpoint';
import {EndpointEvents} from '../IEndpoint';
import {EventEmitter} from "events";
import {IChannel} from '../IChannel';
import {IUser} from '../IUser';
import {IMessage} from '../Events/IMessage';
import {IJoin} from '../Events/IJoin';
import {ILeave} from '../Events/ILeave';
import * as Discord from 'discord.js';

import{EndpointConfig} from '../config/EndpointConfig';
import { IAuthable } from "../IAuthable";

export class DiscordMessage implements IMessage {
    constructor(endpoint:DiscordEndpoint, message:Discord.Message) {
        this.endpoint = endpoint;
        this.msg = message;
    }

    get message(): string {
        return this.msg.content;
    }

    get from(): IUser {
        return new DiscordUser(this.endpoint, this.msg.author);
    }
    get isDirectMessage(): boolean {
        return this.msg.channel.type == "dm";
    }

    get target(): IUser | IChannel {
        if (this.isDirectMessage) {
            return this.endpoint.me;
        } else {
            return new DiscordChannel(this.endpoint, <Discord.TextChannel>this.msg.channel);
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
    endpoint: DiscordEndpoint;
    msg:Discord.Message;

    get discriminator() : string {
        return "CORE.DiscordMessage";
    }
}

export class DiscordUser implements IUser {
    constructor(endpoint:DiscordEndpoint, user:Discord.User) {
        this.user = user;
        this.endpoint = endpoint;
    }

    get name(): string {
        return this.user.username;
    }
    
    get account(): string {
        return this.user.id;
    }

    discriminator: string = "CORE.DiscordUser";
    say(message: string): void {
        this.user.sendMessage(message);
    }
    action(message: string): void {
        this.user.sendMessage("*" + message + "*");
    }
    endpoint: IEndpoint;
    user:Discord.User;
}

export class DiscordChannel implements IChannel {
    constructor(endpoint:DiscordEndpoint, chann:Discord.TextChannel) {
        this.endpoint = endpoint;
        this.chann = chann;
    }

    users: { [key: string]: IUser; };
    topic: string;
    name: string;
    say(message: string): void {
        this.chann.send(message);
    }

    action(message: string): void {
        this.chann.send("*" + message + "*");
    }
    part(): void {
        throw new Error("Method not implemented.");
    }

    userHasRole(user:IUser, role:string):Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            resolve(this.chann.members.filter(p => p.id == user.account).first().roles.filter(p => p.id == role).size > 0);
        });
    }
    
    discriminator: string = "CORE.DiscordChannel";
    endpoint: DiscordEndpoint;
    chann:Discord.TextChannel;
}

export class DiscordEndpoint extends EventEmitter implements IEndpoint {

    get type() : EndpointTypes {
        return EndpointTypes.Discord;
    }
    
    get name() : string {
        return this.config.name || this.type.toString();
    }
    constructor(options:EndpointConfig, authBot:IAuthable) {
        super();

        this.config = options;
        this.authBot = authBot;
    }

    connect(): void {
        console.log("discord connect");
        this.client = new Discord.Client();
        this.client.on('ready', () => {
            this.emit(EndpointEvents.Connected.toString(), this, this.me);
        });
        this.client.on('message', msg => {
            let msg2 = new DiscordMessage(this, msg);
            this.emit(EndpointEvents.Message.toString(), this, msg2);
        });
        
        this.client.login(this.config.connectionString[0]);
    }
    disconnect(): void {
        throw new Error("Method not implemented.");
    }
    get isConnected(): boolean {
        return this.client.status != 5; // 5 == disconnected
    }
    join(channel: string | IChannel, key: string): void {
        throw new Error("Method not implemented.");
    }
    part(channel: string | IChannel): void {
        throw new Error("Method not implemented.");
    }
    say(destination: string | IChannel | IUser, message: string): void {
        if (typeof destination === "string") {
            (<Discord.TextChannel>this.client.channels.get(destination)).send(message);
        } else {
            (<Discord.TextChannel>this.client.channels.get(destination.name)).send(message);
        }
    }
    action(destination: string | IChannel | IUser, message: string): void {
        this.say(destination, "*"+message+"*");
    }
    send(msg: IMessage): void {
        this.say(msg.target, msg.message);
    }

    get me(): IUser {
        return new DiscordUser(this, this.client.user);
    }
    client:Discord.Client;
    config:EndpointConfig;
    authBot:IAuthable;
}
