import {EndpointTypes} from "../EndpointTypes";
import {IEndpoint, IEndpointBot} from '../IEndpoint';
import {EndpointEvents} from '../IEndpoint';
import {EventEmitter} from "events";
import {IChannel} from '../IChannel';
import {IUser} from '../IUser';
import {IMessage} from '../Events/IMessage';
import {IJoin} from '../Events/IJoin';
import {ILeave} from '../Events/ILeave';
import * as builder from 'botbuilder';
import{EndpointConfig} from '../config/EndpointConfig';
import { IAuthable } from "../IAuthable";
import { BotFrameworkAdapter, TurnContext } from "botbuilder";
import { ConversationReference } from "botframework-connector/lib/connectorApi/models/mappers";
import { IEventable } from "../IEventable";
import { Command } from "../Command";

export class BotFrameworkMessage implements IMessage {
    constructor(endpoint:BotFrameworkEndpoint, context: builder.TurnContext) {
        this.endpoint = endpoint;
        this.context = context;

        let r = builder.TurnContext.getConversationReference(this.context.activity);
        this.user = new BotFrameworkUser(this.endpoint, this.context.activity.from, r);
    }

    get message(): string {
        return this.context.activity.text;
    }

    get from(): IUser {
        return this.user;
    }
    get isDirectMessage(): boolean {
        return !this.context.activity.conversation.isGroup;
    }

    get target(): IUser | IChannel {
        if (this.isDirectMessage) {
            return this.endpoint.me;
        } else {
            let t = TurnContext.getConversationReference(this.context.activity);
            return new BotFrameworkChannel(this.endpoint, t);
        }
    }

    async reply(message: string): Promise<builder.ResourceResponse> {
        return this.context.sendActivity(message);
    }
    async action(message: string): Promise<builder.ResourceResponse> {
        return this.context.sendActivity(message);
    }
    async notice(message: string): Promise<builder.ResourceResponse> {
        return this.context.sendActivity(message);
    }
    
    part(): void {
        throw new Error("Method not implemented.");
    }
    endpoint: BotFrameworkEndpoint;

    get discriminator() : string {
        return "CORE.BotFrameworkMessage";
    }

    context: builder.TurnContext;
    user: BotFrameworkUser;
}

export class BotFrameworkUser implements IUser {
    constructor(endpoint:BotFrameworkEndpoint, user: builder.ChannelAccount, convo:Partial<builder.ConversationReference>) {
        // this.user = user;
        this.endpoint = endpoint;
        this.convo = convo;
        this.user = user;
    }

    get name(): string {
        return this.user.name;
    }
    
    get account(): string {
        return this.user.id;
    }

    discriminator: string = "CORE.BotFrameworkUser";

    async say(message: string): Promise<void> {
        return this.endpoint.adapter.createConversation(this.convo, async (c) => {
            try {
                await c.sendActivity(message);
            }
            catch(ex) {
                console.error(ex);
            }
        });
    }

    async action(message: string): Promise<void> {
        return this.endpoint.adapter.createConversation(this.convo, async (c) => {
            try {
                await c.sendActivity(message);
            }
            catch(ex) {
                console.error(ex);
            }
        });
    }

    endpoint: BotFrameworkEndpoint;
    convo: Partial<builder.ConversationReference>;
    user: builder.ChannelAccount;
}

export class BotFrameworkChannel implements IChannel {
    constructor(endpoint:BotFrameworkEndpoint, chann : Partial<builder.ConversationReference>) {
        this.endpoint = endpoint;
        this.chann = chann;
    }

    users: { [key: string]: IUser; };
    topic: string;
    get name(): string {
        return this.chann.conversation.name;
    }

    async say(message: string): Promise<void> {
        return this.endpoint.adapter.continueConversation(this.chann, async (c) => {
            await c.sendActivity(message);
        });
    }

    async action(message: string): Promise<void> {
        return this.endpoint.adapter.continueConversation(this.chann, async (c) => {
            await c.sendActivity(message).catch(r => console.error(r));
        });
    }
    part(): void {
        throw new Error("Method not implemented.");
    }

    userHasRole(user:IUser, role:string):Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {

            resolve(false);
        });
    }
    
    discriminator: string = "CORE.BotFrameworkChannel";
    endpoint: BotFrameworkEndpoint;
    chann: Partial<builder.ConversationReference>;
}

export class BotFrameworkEndpoint extends EventEmitter implements IEndpoint {

    get type() : EndpointTypes {
        return EndpointTypes.BotFramework;
    }
    
    get name() : string {
        return this.config.name || this.type.toString();
    }
    constructor(options:EndpointConfig, authBot:IEndpointBot) {
        super();

        this.config = options;
        this.authBot = authBot;

        this.on("BotFwAPI", (req, res) => {
            res.status = () => {};
            this.adapter.processActivity(req, res, async (context) => {
                // Do something with this incoming activity!
                try
                {
                    this.meUser = new BotFrameworkUser(this, context.activity.recipient, null);

                    // await context.sendActivity("HELLO!!!");
                    console.log("BFE1");
                    let msg = new BotFrameworkMessage(this, context);   
                    console.log("BFE2");
                    this.emit(EndpointEvents.Message.toString(), this, msg);
                    await this.authBot.onMessage(this, msg);
                }
                catch(ex) {
                    console.error(ex);
                }
            });
        });
    }

    connect(): void {
        this.adapter = new builder.BotFrameworkAdapter
            ({ appId: this.config.connectionString[0], appPassword: this.config.connectionString[1] }); 
    }
    
    disconnect(): void {
        throw new Error("Method not implemented.");
    }
    get isConnected(): boolean {
        // return this.client.status != 5; // 5 == disconnected
        return true;
    }
    join(channel: string | IChannel, key: string): void {
        throw new Error("Method not implemented.");
    }
    part(channel: string | IChannel): void {
        throw new Error("Method not implemented.");
    }
    say(destination: string | IChannel | IUser, message: string): void {
        if (typeof destination === "string") {
            // let chan = (<BotFramework.TextChannel>this.client.channels.get(destination));
            
            // if (!chan) {
            //     // chan = (<BotFramework.TextChannel>this.client.channels.filter( (v, k, col) => (<BotFramework.TextChannel>v).name == destination).first());
            //     if (!chan) throw new Error("Cannot find channel " + destination);
            // }

            // this.adapter.createConversation()
        } else {
            // let dest = null;
            // // destination HAS to be a BotFramework channel or user
            // if (destination.discriminator.indexOf("Channel") > 0) {
            //     let t = <BotFrameworkChannel>destination;
            //     // dest = (<BotFramework.TextChannel>this.client.channels.get(t.chann.id));
            // }
            // else {
            //     let t = <BotFrameworkUser>destination;
            //     // dest = this.client.users.get(t.user.id);
            // }

            // dest.send(message);
            
        }
    }
    action(destination: string | IChannel | IUser, message: string): void {
        this.say(destination, "*"+message+"*");
    }
    send(msg: IMessage): void {
        this.say(msg.target, msg.message);
    }

    get me(): IUser {
        return this.meUser;
    }

    async emitAsync(...args:any[]):Promise<void> {
        return new Promise( res => {
            this.emit.apply(this, args);
            res();
        });
    }

    registerCommand(cmd:Command<IMessage>) {
    }
    
    deregisterCommand(cmd:Command<IMessage>) {
    }
    
    config:EndpointConfig;
    authBot:IEndpointBot;
    adapter:BotFrameworkAdapter;
    meUser: BotFrameworkUser;
}
