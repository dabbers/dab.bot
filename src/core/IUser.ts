export interface IUser {
    name:string;
    discriminator: 'CORE.IUser';
    
    say(message:string):void;
    action(message:string):void;
}