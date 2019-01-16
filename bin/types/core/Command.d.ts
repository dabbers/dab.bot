/// <reference types="node" />
import { IEvent } from './Events/IEvent';
import { IEndpoint } from './IEndpoint';
import { IChannel } from './IChannel';
import { Bot } from './Bot';
import { IUser } from './IUser';
export declare class CommandThrottleOptions {
    user: number;
    channel: number;
    endpoint: number;
    constructor(user: number, channel: number, endpoint: number);
    canCommandExecute(lastUser: Date, lastChannel: Date, lastEndpoint: Date): boolean;
}
export declare class CommandBindOptions {
    binding: string;
    constructor(binding: string);
    canCommandExecute(event: IEvent): boolean;
    toJSON(): {
        binding: string;
    };
    private parsed;
}
export declare enum CommandAuthTypes {
    Account = "account",
    Level = "level",
    Name = "name",
    Role = "role",
}
export declare class CommandAuthOptions {
    authType: CommandAuthTypes;
    authValue: string;
    constructor(authType: CommandAuthTypes, authValue: string);
    canCommandExecute(event: IEvent): Promise<boolean>;
    toJSON(): {
        authType: CommandAuthTypes;
        authValue: string;
    };
    private authValueRegex;
}
export declare class Command<EventType extends IEvent> {
    readonly name: string;
    static Deserialize<EventType extends IEvent>(jsonObject: any): Command<EventType>;
    constructor(name: string, fnc: (Bot, IEvent) => any, throttle: CommandThrottleOptions, binding: CommandBindOptions[], auths: CommandAuthOptions[], serialize?: boolean, requireCommandPrefix?: boolean);
    throttle: CommandThrottleOptions;
    binding: CommandBindOptions[];
    auth: CommandAuthOptions[];
    execute(bot: Bot, message: EventType): Promise<boolean>;
    toJSON(): {
        name: string;
        fnc: string;
        throttle: CommandThrottleOptions;
        binding: CommandBindOptions[];
        auth: CommandAuthOptions[];
        serialize: boolean;
        requireCommandPrefix: boolean;
    };
    toString(): string;
    lastUser: Map<IUser, Date>;
    lastEndpoint: Map<IEndpoint, EndpointTimestampCollection>;
    serialize: boolean;
    requireCommandPrefix: boolean;
    private _name;
    fnc: (bot: Bot, event: IEvent, req: NodeRequire) => any;
}
export declare class EndpointTimestampCollection {
    lastEndpoint: Date;
    lastChannel: Map<IChannel, Date>;
    constructor();
    updateTimestamp(event: IEvent, latest: Date): void;
}
