import { IChannel } from "../IChannel";
import { IEvent } from './IEvent';
export interface IJoin extends IEvent {
    target: IChannel;
}
