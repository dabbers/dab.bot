import { IEvent } from './IEvent';
export interface INameChange extends IEvent {
    newName: string;
}
