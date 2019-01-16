import { IChannel } from "../../core/IChannel";
import { IUser } from "../../core/IUser";
import { IEndpoint } from "../../core/IEndpoint";
import { ICommandMessage } from "../../core/CommandMessage";
export declare class WebApiMessage implements ICommandMessage {
    command: string;
    args: string[];
    message: string;
    isDirectMessage: boolean;
    target: IChannel | IUser;
    response: string;
    reply(message: string): void;
    action(message: string): void;
    notice(message: string): void;
    part(): void;
    from: IUser;
    endpoint: IEndpoint;
    discriminator: string;
}
