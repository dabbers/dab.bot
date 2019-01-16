/// <reference types="node" />
import { EndpointTypes } from "../EndpointTypes";
import { IEndpoint } from '../IEndpoint';
import { EventEmitter } from "events";
import { IChannel } from '../IChannel';
import { IUser } from '../IUser';
import { IMessage } from '../Events/IMessage';
import * as Discord from 'discord.js';
import { EndpointConfig } from '../config/EndpointConfig';
import { IAuthable } from "../IAuthable";
export declare class DiscordMessage implements IMessage {
    constructor(endpoint: DiscordEndpoint, message: Discord.Message);
    readonly message: string;
    readonly from: IUser;
    readonly isDirectMessage: boolean;
    readonly target: IUser | IChannel;
    reply(message: string): void;
    action(message: string): void;
    notice(message: string): void;
    part(): void;
    endpoint: DiscordEndpoint;
    msg: Discord.Message;
    readonly discriminator: string;
}
export declare class DiscordUser implements IUser {
    constructor(endpoint: DiscordEndpoint, user: Discord.User);
    readonly name: string;
    readonly account: string;
    discriminator: string;
    say(message: string): void;
    action(message: string): void;
    endpoint: IEndpoint;
    user: Discord.User;
}
export declare class DiscordChannel implements IChannel {
    constructor(endpoint: DiscordEndpoint, chann: Discord.TextChannel);
    users: {
        [key: string]: IUser;
    };
    topic: string;
    readonly name: string;
    say(message: string): void;
    action(message: string): void;
    part(): void;
    userHasRole(user: IUser, role: string): Promise<boolean>;
    discriminator: string;
    endpoint: DiscordEndpoint;
    chann: Discord.TextChannel;
}
export declare class DiscordEndpoint extends EventEmitter implements IEndpoint {
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
    readonly me: IUser;
    client: Discord.Client;
    config: EndpointConfig;
    authBot: IAuthable;
}
