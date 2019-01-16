export interface IUser {
    name: string;
    account: string;
    discriminator: string;
    say(message: string): void;
    action(message: string): void;
}
