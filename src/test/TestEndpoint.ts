import {IEndpoint} from '../core/IEndpoint';
import {EndpointTypes} from '../core/EndpointTypes';
import {IChannel} from '../core/IChannel';
import {IUser} from '../core/IUser';
import {IMessage} from '../core/Events/IMessage';
import { IAuthable } from '../core/IAuthable';
import { EndpointConfig } from '../core/config/EndpointConfig';

export class TestEndpoint implements IEndpoint {
    type: EndpointTypes = EndpointTypes.IRC;    name: string = "TestEndpoint";

    constructor(overrideMthds: { [method: string] : any}) {
        for(let m in overrideMthds) {
            this[m] = overrideMthds[m];
        }
    }

    connect(): void {
        throw new Error("Method not implemented.");
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
    say(destination: string | IUser | IChannel, message: string): void {
        throw new Error("Method not implemented.");
    }
    action(destination: string | IUser | IChannel, message: string): void {
        throw new Error("Method not implemented.");
    }
    send(msg: IMessage): void {
        throw new Error("Method not implemented.");
    }
    me: IUser;
    addListener(event: string | symbol, listener: (...args: any[]) => void): this {
        throw new Error("Method not implemented.");
    }
    on(event: string | symbol, listener: (...args: any[]) => void): this {
        throw new Error("Method not implemented.");
    }
    once(event: string | symbol, listener: (...args: any[]) => void): this {
        throw new Error("Method not implemented.");
    }
    prependListener(event: string | symbol, listener: (...args: any[]) => void): this {
        throw new Error("Method not implemented.");
    }
    prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this {
        throw new Error("Method not implemented.");
    }
    removeListener(event: string | symbol, listener: (...args: any[]) => void): this {
        throw new Error("Method not implemented.");
    }
    removeAllListeners(event?: string | symbol): this {
        throw new Error("Method not implemented.");
    }
    setMaxListeners(n: number): this {
        throw new Error("Method not implemented.");
    }
    getMaxListeners(): number {
        throw new Error("Method not implemented.");
    }
    listeners(event: string | symbol): Function[] {
        throw new Error("Method not implemented.");
    }
    rawListeners(event: string | symbol): Function[] {
        throw new Error("Method not implemented.");
    }
    emit(event: string | symbol, ...args: any[]): boolean {
        throw new Error("Method not implemented.");
    }
    eventNames(): (string | symbol)[] {
        throw new Error("Method not implemented.");
    }
    listenerCount(type: string | symbol): number {
        throw new Error("Method not implemented.");
    }

    authBot:IAuthable;
    config:EndpointConfig;
}
