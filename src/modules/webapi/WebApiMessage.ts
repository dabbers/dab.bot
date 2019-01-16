import { IChannel } from "../../core/IChannel";
import { IUser } from "../../core/IUser";
import { IEndpoint } from "../../core/IEndpoint";
import { EndpointTypes } from "../../core/EndpointTypes";
import { EndpointConfig } from "../../core/config/EndpointConfig";
import { ICommandMessage } from "../../core/CommandMessage";

export class WebApiMessage implements ICommandMessage {
    command: string;
    args: string[];
    message: string;    isDirectMessage: boolean;
    target: IChannel | IUser;
    response:string = '';

    reply(message: string): void {
        this.response += message +"<br />\r\n";
    }
    action(message: string): void {
    }
    notice(message: string): void {
    }
    part(): void {
    }
    from: IUser;
    endpoint: IEndpoint = <IEndpoint><any>{config:<EndpointConfig><any>{commandPrefix:"", type:EndpointTypes.Internal, name:"http"}};
    discriminator: string;
}
