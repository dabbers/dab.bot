/// <reference types="node" />
import { EndpointTypes } from "../EndpointTypes";
import { IEndpoint } from '../IEndpoint';
import { EventEmitter } from "events";
import { IChannel } from '../IChannel';
import { IUser } from '../IUser';
import { IMessage } from '../Events/IMessage';
import * as Telegram from 'telegraf';
import { User } from 'telegram-typings';
import { EndpointConfig } from '../config/EndpointConfig';
import { IAuthable } from "../IAuthable";
export declare class TelegramMessage implements IMessage {
    constructor(endpoint: TelegramEndpoint, message: Telegram.ContextMessageUpdate);
    readonly message: string;
    readonly from: IUser;
    readonly isDirectMessage: boolean;
    readonly target: IUser | IChannel;
    reply(message: string): void;
    action(message: string): void;
    notice(message: string): void;
    part(): void;
    endpoint: TelegramEndpoint;
    msg: Telegram.ContextMessageUpdate;
    fromUser: TelegramUser;
    readonly discriminator: string;
    toString(): string;
}
export declare class TelegramUser implements IUser {
    constructor(endpoint: TelegramEndpoint, user: User);
    readonly account: string;
    readonly name: string;
    discriminator: string;
    say(message: string): void;
    action(message: string): void;
    user: User;
    endpoint: TelegramEndpoint;
    toString(): string;
}
export declare class TelegramChannel implements IChannel {
    constructor(endpoint: TelegramEndpoint, chann: Telegram.ContextMessageUpdate);
    users: {
        [key: string]: IUser;
    };
    topic: string;
    name: string;
    say(message: string): void;
    action(message: string): void;
    part(): void;
    userHasRole(user: IUser, role: string): Promise<boolean>;
    discriminator: string;
    endpoint: TelegramEndpoint;
    chann: Telegram.ContextMessageUpdate;
    toString(): string;
}
export declare class TelegramEndpoint extends EventEmitter implements IEndpoint {
    readonly type: EndpointTypes;
    readonly name: string;
    constructor(options: EndpointConfig, authBot: IAuthable);
    connect(): void;
    disconnect(): void;
    readonly isConnected: boolean;
    join(channel: string | IChannel, key: string): void;
    part(channel: string | IChannel): void;
    say(destination: string | IChannel | IUser, message: string): void;
    action(destination: string | IChannel | IUser, message: string): void;
    send(msg: IMessage): void;
    toString(): string;
    me: IUser;
    client: Telegram.Telegraf<Telegram.ContextMessageUpdate>;
    config: EndpointConfig;
    authBot: IAuthable;
}
