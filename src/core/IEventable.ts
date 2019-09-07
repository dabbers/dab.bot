import { IEndpoint } from "./IEndpoint";
import { IMessage } from "./Events/IMessage";

export interface IEventable {
    onMessage (sender:IEndpoint, msg:IMessage) : Promise<void>;
}