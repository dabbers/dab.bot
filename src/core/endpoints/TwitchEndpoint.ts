import {EndpointTypes} from "../EndpointTypes";
import {IEndpoint} from '../IEndpoint';
import {EndpointEvents} from '../IEndpoint';
import {EventEmitter} from "events";
import {IChannel} from '../IChannel';
import {IUser} from '../IUser';
import {IMessage} from '../Events/IMessage';
import {IJoin} from '../Events/IJoin';
import {ILeave} from '../Events/ILeave';
import * as twitch from 'tmi.js';

import{EndpointConfig} from '../config/EndpointConfig';
import { IAuthable } from "../IAuthable";
import { GenericIrcUser } from "./IrcEndpoint";

export class TwitchMessage implements IMessage {
    constructor(ep:TwitchEndpoint, from:IUser, target:(IUser | IChannel), message:string) {
        this.message = message;
        this.from = from;
        this.target = target;
        this.isDirectMessage = (target.discriminator.indexOf("User") > 0);
        this.endpoint = ep;
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
        return "CORE.IrcMessage";
    }

    toString() : string {
        return "[" + this.discriminator + " Message]";
    }
}


export class TwitchUser implements IUser {
    constructor(endpoint:TwitchEndpoint, display:string, username:string, id:string) {
        this.endpoint = endpoint;

        this.name = display;
        this.username = username;
        this.account = id;
    }

    discriminator:string = "CORE.IrcUser";
    name: string;
    username: string;
    account: string;

    say(message: string): void {
        this.endpoint.say(this, message);
    }
    action(message: string): void {
        this.endpoint.action(this, message);
    }

    endpoint: IEndpoint;

    toString() : string {
        return "[" + this.name + " " + this.discriminator + " User]";
    }
}

export class TwitchChannel implements IChannel {
    constructor(endpoint:TwitchEndpoint, name:string, topic?:string, user?: { [key: string]: IUser; }) {
        this.endpoint = endpoint;
        this.name = name;
        this.topic = topic;
        this.users = user;
    }

    discriminator:string = "CORE.IrcChannel";
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

    userHasRole(user:IUser, role:string):Promise<boolean> {
        return new Promise((resolve, reject) => {
            resolve(false);
        });
    }

    endpoint: IEndpoint;

    toString() : string {
        return "[" + this.name + " " + this.discriminator + " Channel]";
    }
}


export class TwitchEndpoint extends EventEmitter implements IEndpoint {
    
    get me(): IUser {
        return new TwitchUser(this, this.config.nickname, this.config.nickname, "");
    }

    constructor(options:EndpointConfig, authBot:IAuthable) {
        super();

        this.config = options || null;
        this.client = new twitch.Client();
        this.authBot = authBot;
    }

    say(destination: (IUser | IChannel | string), message: string): void {
        let msgParts = message.split("\n");
        let dst = "";

        if (typeof destination === "string") {
            dst = destination;
        }
        else {
            dst = destination.name;
        }

        this.client.say(dst, msgParts[0]);

        for(let i = 1; i < msgParts.length; i++) {
            this.client.say(dst, "" + msgParts[i]);
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
        console.log("Twitch Connect");

        if (!this.config) {
            throw new Error("Options are required");
        }

        var options = {
            options: {
                debug: true,
                clientId:this.config.connectionString[0]
            },
            connection: {
                reconnect: true
            },
            identity: {
                username: this.config.nickname,
                password: this.config.password
            }
        };

        this.client = new twitch.client();

        this.client.on('registered', () => {
            console.log('Connected!');

            if (this.config.channels) {
                for(let chan of this.config.channels) {
                    this.client.join(chan.name, chan.password);
                }
            }

            this.emit(EndpointEvents.Connected.toString(), this, this.me);
        });
        
        this.client.on('close', () => {
            console.log('Connection close');
            this.emit(EndpointEvents.Disconnected.toString(), this, this.me);        
        });

        this.client.on("chat", function (channel:string, userstate, message, self) {
            // Don't listen to my own messages..
            if (self) return;

            let msg = new TwitchMessage(
                this,
                new TwitchUser(this, message["display-name"], message.username, message["user-id"]),
                (channel[0] == "#" ? new TwitchChannel(this, channel) : this.me),
                message
            );

            this.emit(EndpointEvents.Message.toString(), this, msg);
        });

        this.client.on('message', (event) => {

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

        this.client.connect();
    }

    disconnect(): void {
        this.client.quit();
    }

    get isConnected(): boolean {
        return this.client.connected;   
    };

    join(channel: (IChannel|string), key:string) {
        if (typeof channel === "string") {
            this.client.join(channel, key);
        }
        else {
            this.client.join(channel.name, key);
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
    authBot:IAuthable;

    toString() : string {
        return "[" + this.name + " Endpoint]";
    }
}
