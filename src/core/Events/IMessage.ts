import {IUser} from "../IUser";
import {IChannel} from "../IChannel";
import { IEvent } from "./IEvent";

export interface IMessage extends IEvent {

    message:string;
    isDirectMessage:boolean;

    target:(IChannel|IUser); // either a channel or the bot
    
    reply(message:string):void;
    action(message:string):void;
    notice(message:string):void;

    part():void;
}
