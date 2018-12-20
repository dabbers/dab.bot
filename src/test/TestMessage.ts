import {IMessage} from '../core/Events/IMessage';
import {IUser} from '../core/IUser';
import {IChannel} from '../core/IChannel';
import {IEndpoint} from '../core/IEndpoint';
import {TestEndpoint} from './TestEndpoint';

export class TestMessage implements IMessage {
    message: string;    isDirectMessage: boolean;
    target: IUser | IChannel;

    constructor(overrideMthds: { [method: string] : any}, endpoint?:IEndpoint) {
        for(let m in overrideMthds) {
            this[m] = overrideMthds[m];
        }

        if (!endpoint) {
            endpoint = new TestEndpoint({});
        }

        this.endpoint = endpoint;
    }

    reply(message: string): void {
        throw new Error("Method not implemented.");
    }
    action(message: string): void {
        throw new Error("Method not implemented.");
    }
    notice(message: string): void {
        throw new Error("Method not implemented.");
    }
    part(): void {
        throw new Error("Method not implemented.");
    }
    from: IUser;
    endpoint: IEndpoint;
    discriminator: string = "TestMessage";


}
