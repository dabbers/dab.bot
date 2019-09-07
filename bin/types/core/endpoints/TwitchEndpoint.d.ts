/// <reference types="node" />
import { EndpointTypes } from "../EndpointTypes";
import { IEndpoint, IEndpointBot } from '../IEndpoint';
import { EventEmitter } from "events";
import { IChannel } from '../IChannel';
import { IUser } from '../IUser';
import { IMessage } from '../Events/IMessage';
import { EndpointConfig } from '../config/EndpointConfig';
export declare class TwitchMessage implements IMessage {
    constructor(ep: TwitchEndpoint, from: IUser, target: (IUser | IChannel), message: string);
    message: string;
    from: IUser;
    isDirectMessage: boolean;
    target: IUser | IChannel;
    reply(message: string): void;
    action(message: string): void;
    notice(message: string): void;
    part(): void;
    endpoint: IEndpoint;
    readonly discriminator: string;
    toString(): string;
}
export declare class TwitchUser implements IUser {
    constructor(endpoint: TwitchEndpoint, display: string, username: string, id: string);
    discriminator: string;
    name: string;
    username: string;
    account: string;
    say(message: string): void;
    action(message: string): void;
    endpoint: IEndpoint;
    toString(): string;
}
export declare class TwitchChannel implements IChannel {
    constructor(endpoint: TwitchEndpoint, name: string, topic?: string, user?: {
        [key: string]: IUser;
    });
    discriminator: string;
    users: {
        [key: string]: IUser;
    };
    topic: string;
    name: string;
    say(message: string): void;
    action(message: string): void;
    part(): void;
    userHasRole(user: IUser, role: string): Promise<boolean>;
    endpoint: IEndpoint;
    toString(): string;
}
export declare class TwitchEndpoint extends EventEmitter implements IEndpoint {
    readonly me: IUser;
    constructor(options: EndpointConfig, authBot: IEndpointBot);
    say(destination: (IUser | IChannel | string), message: string): void;
    action(destination: (IUser | IChannel | string), message: string): void;
    raw(message: string): void;
    send(message: IMessage): void;
    readonly type: EndpointTypes;
    readonly name: string;
    connect(): void;
    disconnect(): void;
    readonly isConnected: boolean;
    join(channel: (IChannel | string), key: string): void;
    part(channel: (IChannel | string)): void;
    client: any;
    config: EndpointConfig;
    authBot: IEndpointBot;
    toString(): string;
}
