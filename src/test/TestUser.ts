import {IMessage} from '../core/Events/IMessage';
import {IUser} from '../core/IUser';
import {IChannel} from '../core/IChannel';
import {IEndpoint} from '../core/IEndpoint';
import {TestEndpoint} from './TestEndpoint';

export class TestUser implements IUser {
    name: string;
    account: string;
    discriminator: "CORE.IUser";
    say(message: string): void {
        throw new Error("Method not implemented.");
    }
    action(message: string): void {
        throw new Error("Method not implemented.");
    }

    constructor(overrideMthds: { [method: string] : any}) {
        for(let m in overrideMthds) {
            this[m] = overrideMthds[m];
        }
    }
}
