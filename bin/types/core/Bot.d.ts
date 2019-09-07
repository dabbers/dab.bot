/// <reference types="node" />
import * as EventEmitter from 'events';
import { BotConfig } from "./config/BotConfig";
import { Module } from './Module';
import { IEndpoint } from './IEndpoint';
import { ITickable } from './ITickable';
import { Command } from './Command';
import { IEvent } from './Events/IEvent';
import { IMessage } from './Events/IMessage';
import { IAuthable } from './IAuthable';
import { ManagerConfig } from './config/ManagerConfig';
import { IEventable } from './IEventable';
export interface ICommandThrottleOptions {
    user: number;
    channel: number;
    endpoint: number;
}
export interface ICommandBindOptions {
    binding: string;
}
export interface ICommandAuthOptions {
    authType: ("account" | "level" | "name" | "role");
    authValue: string;
}
export declare class Bot extends EventEmitter implements ITickable, IAuthable, IEventable {
    discriminator: string;
    cmdStorage: string;
    constructor(config: BotConfig);
    onMessage(sender: IEndpoint, msg: IMessage): Promise<void>;
    init(): void;
    loadModule(module: string, cfg?: any, endpoint?: string): Bot;
    reloadModule(module: string, endpoint?: string): void;
    unloadModule(module: string): Bot;
    loginUser(message: IMessage): boolean;
    isUserAuthed(message: IEvent): number;
    logoutUser(message: IEvent): boolean;
    initNewCommand(name: string, fnc: (Bot: any, IEvent: any) => any, throttle: ICommandThrottleOptions, binding: ICommandBindOptions[], auths: ICommandAuthOptions[], serialize?: boolean, requireCommandPrefix?: boolean): Command<IMessage>;
    addCommand(cmd: Command<IMessage>): Bot;
    delCommand(cmd: string): Bot;
    setCommand(cmd: Command<IEvent>): Bot;
    tick(): void;
    endpoints: {
        [key: string]: IEndpoint;
    };
    config: BotConfig;
    modules: {
        [key: string]: Module;
    };
    textCommands: {
        [key: string]: Command<IMessage>;
    };
    txtCmdsDirty: boolean;
    auth: Map<IEndpoint, Map<string, number>>;
    authOptions: Map<IEndpoint, Manager[]>;
    toString(): string;
}
export declare class Manager extends ManagerConfig {
    constructor(cfg: ManagerConfig);
    valueRegex: RegExp;
}
