import {EndpointTypes} from "../EndpointTypes";
import {IEndpoint} from '../IEndpoint';
import {EndpointEvents} from '../IEndpoint';
import {EventEmitter} from "events";
import {IChannel} from '../IChannel';
import {IUser} from '../IUser';
import {IMessage} from '../Events/IMessage';
import {IJoin} from '../Events/IJoin';
import {ILeave} from '../Events/ILeave';
import * as IRC from 'irc-framework';

import{EndpointConfig} from '../config/EndpointConfig';

export class IrcMessage implements IMessage {
    constructor(ep:IrcEndpoint, from:IUser, target:(IUser | IChannel), message:string) {
        this.message = message;
        this.from = from;
        this.target = target;
        this.isDirectMessage = (target.discriminator == "CORE.IUser");
    }
    message: string;
    from: IUser;
    isDirectMessage: boolean;
    target: IUser | IChannel;

    reply(message: string): void {
        this.endpoint.say((this.isDirectMessage ? this.from : this.target), message);
    }
    action(message: string): void {
        this.endpoint.action((this.isDirectMessage ? this.from : this.target), message);
    }
    notice(message: string): void {
        this.endpoint.say((this.isDirectMessage ? this.from : this.target), message);
    }
    part(): void {
        if (!this.isDirectMessage) {
            this.endpoint.part(<IChannel>this.target);
        }
    }

    endpoint: IEndpoint;

    get discriminator() : string {
        return "IrcMessage";
    }
}

class GenericIrcUser {
    nick:string;
    username:string;
    hostname:string;   
}

export class IrcUser implements IUser {
    constructor(endpoint:IrcEndpoint, user:GenericIrcUser|string, ident?:string, host?:string, real?:string) {
        this.endpoint = endpoint;

        if (typeof user === "string") {
            this.name = user;
            this.ident = ident;
            this.host = host;
            this.real = real;
        } else {
            if (ident) throw "Cannot mix GenericUser with extra params";

            this.name = user.nick;
            this.ident = user.username;
            this.host = user.hostname;
            this.real = "";
        }
    }

    discriminator: "CORE.IUser";
    name: string;
    ident: string;
    host: string;
    real: string;

    say(message: string): void {
        this.endpoint.say(this, message);
    }
    action(message: string): void {
        this.endpoint.action(this, message);
    }

    endpoint: IEndpoint;
}

export class IrcChannel implements IChannel {
    constructor(endpoint:IrcEndpoint, name:string, topic?:string, user?: { [key: string]: IUser; }) {
        this.endpoint = endpoint;
        this.name = name;
        this.topic = topic;
        this.users = user;
    }

    discriminator: "CORE.IChannel";
    users: { [key: string]: IUser; };
    topic: string;
    name: string;

    say(message: string): void {
        this.endpoint.say(this, message);
    }
    action(message: string): void {
        this.endpoint.action(this, message);
    }
    part(): void {
        this.endpoint.part(<IChannel>this);
    }

    endpoint: IEndpoint;
}


export class IrcEndpoint extends EventEmitter implements IEndpoint {
    
    get me(): IUser {
        return new IrcUser(this, this.client.user.nick, this.client.user.username, this.client.user.host, "");
    }

    constructor(options:EndpointConfig) {
        super();

        this.config = options || null;
        this.client = new IRC.Client();
    }

    say(destination: (IUser | IChannel | string), message: string): void {
        if (typeof destination === "string") {
            this.client.say(destination, message);
        }
        else {
            this.client.say(destination.name, message);
        }
    }

    action(destination: (IUser | IChannel | string), message: string): void {
        if (typeof destination === "string") {
            this.client.action(destination, message);
        }
        else {
            this.client.action(destination.name, message);
        }
    }

    raw(message:string) {
        this.client.raw(message);
    }

    send(message:IMessage): void {
        this.say(message.target, message.message);
    }

    get type(): EndpointTypes {
        return EndpointTypes.IRC;
    }
    
    get name() : string {
        return this.config.name || this.type.toString();
    }

    connect(): void {
        console.log("IRC Connect");
        this.client = new IRC.Client();

        if (!this.config) {
            throw new Error("Options are required");
        }

        let randomIndex = Math.floor(Math.random() * (this.config.connectionString.length));
        let uri = this.config.connectionString[randomIndex].split(":");

        this.client.connect( {
            host:uri[0],
            port:uri[1],
            nick:this.config.nickname,
            username:this.config.nickname,
            name:this.config.name,
            auto_reconnect: true
        });

        this.client.on('registered', () => {
            console.log('Connected!');

            this.client.join('#dab.beta');
            this.emit(EndpointEvents.Connected.toString(), this, this.me);
        });
        
        this.client.on('close', () => {
            console.log('Connection close');
            this.emit(EndpointEvents.Disconnected.toString(), this, this.me);        
        });
        
        this.client.on('message', (event) => {
            // console.log('<' + event.target + '>', event.message);
            // console.log(event);

            let msg = new IrcMessage(
                this,
                new IrcUser(this, <GenericIrcUser>event),
                (event.target[0] == "#" ? new IrcChannel(this, event.target) : this.me),
                event.message
            );

            this.emit(EndpointEvents.Message.toString(), this, msg);
        });
        
        this.client.matchMessage(/^!hi/, (event) => {
            event.reply('sup');
        });
        
        this.client.on('whois', (event) => {
            // console.log(event);
        });
        
        this.client.on('join', (event) => {
            // console.log('user joined', event);
        });
        
        this.client.on('part', (event) => {
        
            // console.log('user part', event);
        
        });
    }

    disconnect(): void {
        this.client.quit();
    }

    get isConnected(): boolean {
        return this.client.connected;   
    };

    join(channel: (IChannel|string), key:string) {
        if (typeof channel === "string") {
            this.client.join(channel);
        }
        else {
            this.client.join(channel.name);
        }
    }

    part(channel: (IChannel|string)) {
        if (typeof channel === "string") {
            this.client.part(channel);
        }
        else {
            this.client.part(channel.name);
        }
    }

    client:any;
    config:EndpointConfig;
}