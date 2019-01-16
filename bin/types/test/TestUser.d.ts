import { IUser } from '../core/IUser';
export declare class TestUser implements IUser {
    name: string;
    account: string;
    discriminator: "CORE.IUser";
    say(message: string): void;
    action(message: string): void;
    constructor(overrideMthds: {
        [method: string]: any;
    });
}
