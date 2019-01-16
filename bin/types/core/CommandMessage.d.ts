import { IMessage } from "./Events/IMessage";
export interface ICommandMessage extends IMessage {
    command: string;
    args: string[];
}
