import { IMessage } from '../core/Events/IMessage';
import { IUser } from '../core/IUser';
import { IChannel } from '../core/IChannel';
import { IEndpoint } from '../core/IEndpoint';
export declare class TestMessage implements IMessage {
    message: string;
    isDirectMessage: boolean;
    target: IUser | IChannel;
    constructor(overrideMthds: {
        [method: string]: any;
    }, endpoint?: IEndpoint);
    reply(message: string): void;
    action(message: string): void;
    notice(message: string): void;
    part(): void;
    from: IUser;
    endpoint: IEndpoint;
    discriminator: string;
}
