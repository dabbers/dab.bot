import { IMessage } from "./Events/IMessage";
import { IChannel } from "./IChannel";
import { IUser } from "./IUser";
import { IEndpoint } from "./IEndpoint";

export interface ICommandMessage extends IMessage {
    command:string;
    args:string[];
}