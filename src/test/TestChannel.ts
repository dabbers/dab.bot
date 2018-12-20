import {IMessage} from '../core/Events/IMessage';
import {IUser} from '../core/IUser';
import {IChannel} from '../core/IChannel';
import {IEndpoint} from '../core/IEndpoint';
import {TestEndpoint} from './TestEndpoint';

export class TestChannel implements IChannel {
    users: { [key: string]: IUser; };    topic: string;
    name: string;

    constructor(overrideMthds: { [method: string] : any}) {
        for(let m in overrideMthds) {
            this[m] = overrideMthds[m];
        }
    }

    say(message: string): void {
        throw new Error("Method not implemented.");
    }
    action(message: string): void {
        throw new Error("Method not implemented.");
    }
    part(): void {
        throw new Error("Method not implemented.");
    }
    userHasRole(user: IUser, role: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    discriminator: string = "CORE.IChannel";


}
