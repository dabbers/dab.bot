import { IUser } from '../core/IUser';
import { IChannel } from '../core/IChannel';
export declare class TestChannel implements IChannel {
    users: {
        [key: string]: IUser;
    };
    topic: string;
    name: string;
    constructor(overrideMthds: {
        [method: string]: any;
    });
    say(message: string): void;
    action(message: string): void;
    part(): void;
    userHasRole(user: IUser, role: string): Promise<boolean>;
    discriminator: string;
}
