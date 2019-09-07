import {EndpointTypes} from "./EndpointTypes"
import {EventEmitter} from "events";
import {IChannel} from './IChannel';
import {IUser} from './IUser';
import {IMessage} from './Events/IMessage';
import { IAuthable } from "./IAuthable";
import { EndpointConfig } from "./config/EndpointConfig";
import { IEventable } from "./IEventable";

export enum EndpointEvents {
    Connected = "Connected",
    NewChannel = "NewChannel",
    UserJoin = "UserJoin",
    UserLeave = "UserLeave",
    NameChange = "NameChange",
    Disconnected = "Disconnected",
    Message = "Message"
};

export interface IEndpointBot extends IAuthable, IEventable {
}
export interface IEndpoint extends EventEmitter {
    type:EndpointTypes;
    name:string;
    connect() : void;
    disconnect() : void;

    readonly isConnected:boolean;

    join(channel:(IChannel|string), key:string) : void;
    part(channel:(IChannel|string)) : void;

    say(destination:(IUser|IChannel|string), message:string) : void;
    action(destination:(IUser|IChannel|string), message:string) : void;
    send(msg:IMessage) : void;
    
    me:IUser;
    authBot:IEndpointBot;
    config:EndpointConfig;
}
