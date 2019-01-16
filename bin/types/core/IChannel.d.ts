import { IUser } from "./IUser";
export interface IChannel {
    users: {
        [key: string]: IUser;
    };
    topic: string;
    name: string;
    say(message: string): void;
    action(message: string): void;
    part(): void;
    userHasRole(user: IUser, role: string): Promise<boolean>;
    discriminator: string;
}
