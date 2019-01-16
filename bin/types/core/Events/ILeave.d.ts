import { IChannel } from "../IChannel";
import { IEvent } from "./IEvent";
export interface ILeave extends IEvent {
    target: [IChannel];
}
