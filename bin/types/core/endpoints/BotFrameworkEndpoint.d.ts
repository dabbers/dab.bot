/// <reference types="node" />
import { EndpointTypes } from "../EndpointTypes";
import { IEndpoint, IEndpointBot } from '../IEndpoint';
import { EventEmitter } from "events";
import { IChannel } from '../IChannel';
import { IUser } from '../IUser';
import { IMessage } from '../Events/IMessage';
import * as builder from 'botbuilder';
import { EndpointConfig } from '../config/EndpointConfig';
import { BotFrameworkAdapter } from "botbuilder";
export declare class BotFrameworkMessage implements IMessage {
    constructor(endpoint: BotFrameworkEndpoint, context: builder.TurnContext);
    readonly message: string;
    readonly from: IUser;
    readonly isDirectMessage: boolean;
    readonly target: IUser | IChannel;
    reply(message: string): Promise<builder.ResourceResponse>;
    action(message: string): Promise<builder.ResourceResponse>;
    notice(message: string): Promise<builder.ResourceResponse>;
    part(): void;
    endpoint: BotFrameworkEndpoint;
    readonly discriminator: string;
    context: builder.TurnContext;
    user: BotFrameworkUser;
}
export declare class BotFrameworkUser implements IUser {
    constructor(endpoint: BotFrameworkEndpoint, user: builder.ChannelAccount, convo: Partial<builder.ConversationReference>);
    readonly name: string;
    readonly account: string;
    discriminator: string;
    say(message: string): Promise<void>;
    action(message: string): Promise<void>;
    endpoint: BotFrameworkEndpoint;
    convo: Partial<builder.ConversationReference>;
    user: builder.ChannelAccount;
}
export declare class BotFrameworkChannel implements IChannel {
    constructor(endpoint: BotFrameworkEndpoint, chann: Partial<builder.ConversationReference>);
    users: {
        [key: string]: IUser;
    };
    topic: string;
    readonly name: string;
    say(message: string): Promise<void>;
    action(message: string): Promise<void>;
    part(): void;
    userHasRole(user: IUser, role: string): Promise<boolean>;
    discriminator: string;
    endpoint: BotFrameworkEndpoint;
    chann: Partial<builder.ConversationReference>;
}
export declare class BotFrameworkEndpoint extends EventEmitter implements IEndpoint {
    readonly type: EndpointTypes;
    readonly name: string;
    constructor(options: EndpointConfig, authBot: IEndpointBot);
    connect(): void;
    disconnect(): void;
    readonly isConnected: boolean;
    join(channel: string | IChannel, key: string): void;
    part(channel: string | IChannel): void;
    say(destination: string | IChannel | IUser, message: string): void;
    action(destination: string | IChannel | IUser, message: string): void;
    send(msg: IMessage): void;
    readonly me: IUser;
    emitAsync(...args: any[]): Promise<void>;
    config: EndpointConfig;
    authBot: IEndpointBot;
    adapter: BotFrameworkAdapter;
    meUser: BotFrameworkUser;
}
