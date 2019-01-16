import { IEndpoint } from '../core/IEndpoint';
import { EndpointTypes } from '../core/EndpointTypes';
import { IChannel } from '../core/IChannel';
import { IUser } from '../core/IUser';
import { IMessage } from '../core/Events/IMessage';
import { IAuthable } from '../core/IAuthable';
import { EndpointConfig } from '../core/config/EndpointConfig';
export declare class TestEndpoint implements IEndpoint {
    type: EndpointTypes;
    name: string;
    constructor(overrideMthds: {
        [method: string]: any;
    });
    connect(): void;
    disconnect(): void;
    isConnected: boolean;
    join(channel: string | IChannel, key: string): void;
    part(channel: string | IChannel): void;
    say(destination: string | IUser | IChannel, message: string): void;
    action(destination: string | IUser | IChannel, message: string): void;
    send(msg: IMessage): void;
    me: IUser;
    addListener(event: string | symbol, listener: (...args: any[]) => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this;
    once(event: string | symbol, listener: (...args: any[]) => void): this;
    prependListener(event: string | symbol, listener: (...args: any[]) => void): this;
    prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;
    removeListener(event: string | symbol, listener: (...args: any[]) => void): this;
    removeAllListeners(event?: string | symbol): this;
    setMaxListeners(n: number): this;
    getMaxListeners(): number;
    listeners(event: string | symbol): Function[];
    rawListeners(event: string | symbol): Function[];
    emit(event: string | symbol, ...args: any[]): boolean;
    eventNames(): (string | symbol)[];
    listenerCount(type: string | symbol): number;
    authBot: IAuthable;
    config: EndpointConfig;
}
