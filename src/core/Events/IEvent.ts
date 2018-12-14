import { IEndpoint } from "../IEndpoint";
import {IUser} from "../IUser";

export interface IEvent {
    from:IUser;
    endpoint:IEndpoint;

    discriminator:string;
}