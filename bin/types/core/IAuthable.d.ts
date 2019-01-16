import { IEvent } from "./Events/IEvent";
export interface IAuthable {
    loginUser(message: IEvent): boolean;
    isUserAuthed(message: IEvent): number;
    logoutUser(message: IEvent): boolean;
}
