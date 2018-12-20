export interface IUser {
    // The visisble, changable username.
    name:string;

    // The service associated account name. Empty if not identified.
    account: string;

    discriminator: string;
    
    say(message:string):void;
    action(message:string):void;
}