import {IEvent} from './Events/IEvent';
import {IEndpoint} from './IEndpoint';
import {IMessage} from './Events/IMessage';
import {ILeave} from './Events/ILeave';
import { IrcMessage } from './endpoints/IrcEndpoint';

export class CommandThrottleOptions {
    user : number = -1;
    channel : number = -1;
    endpoint : number = -1;

    canCommandExecute(lastUser:Date, lastChannel:Date, lastEndpoint:Date) : boolean {
        let canRun = true;

        let now = new Date();
        now.setSeconds(now.getSeconds() + this.user);
        if (this.user != -1 && lastUser != null) {
            if (now > lastUser) {
                canRun = false;
            }
        }

        now = new Date();
        now.setSeconds(now.getSeconds() + this.channel);
        if (this.channel != -1 && lastChannel != null) {
            if (now > lastChannel) {
                canRun = false;
            }
        }

        now = new Date();
        now.setSeconds(now.getSeconds() + this.endpoint);
        if (this.endpoint != -1 && lastEndpoint != null) {
            if (now > lastEndpoint) {
                canRun = false;
            }
        }

        return canRun;
    }
}

class ParsedEndpointBinding {
    channel:RegExp;
    endpoint:RegExp;
}

export class CommandBindOptions {
    endpoints:string[];

    canCommandExecute(event:IEvent) : boolean {
        let canRun = true;
        let target = (event.discriminator.indexOf("Leave") != -1) ? (<ILeave>event).target : [(<IMessage>event).target];

        for(let i in this.parsed) {
            for(let j in target) {
                if (!this.parsed[i].channel.test(j)) {
                    canRun = false;
                }
            }

            if (!this.parsed[i].endpoint.test(event.endpoint.name)) {
                canRun = false;
            }
        }

        return canRun;
    }


    private parsed: ParsedEndpointBinding[];
}

export class Command<EventType extends IEvent> {
    get name() : string {
        return this._name;
    }

    throttle: CommandThrottleOptions;
    endpoints: CommandBindOptions;

    execute<Sender extends IEndpoint>(message:EventType) : Sender {
        this.fnc(message);

        return <Sender>message.endpoint;
    }

    private _name:string;
    private fnc:(IEvent) => any;
}
