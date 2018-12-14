import {IUser} from "../IUser";
import {IChannel} from "../IChannel";
import {IEvent} from './IEvent';

export interface IJoin extends IEvent {
    target:IChannel; // either a channel or the bot

}