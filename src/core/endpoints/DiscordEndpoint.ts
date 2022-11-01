import {EndpointTypes} from "../EndpointTypes";
import {IEndpoint, IEndpointBot} from '../IEndpoint';
import {EndpointEvents} from '../IEndpoint';
import {EventEmitter} from "events";
import {IChannel} from '../IChannel';
import {IUser} from '../IUser';
import {IMessage} from '../Events/IMessage';
import {IJoin} from '../Events/IJoin';
import {ILeave} from '../Events/ILeave';
import * as Discord from 'discord.js';

import{EndpointConfig} from '../config/EndpointConfig';
import { IAuthable } from "../IAuthable";
import { IEventable } from "../IEventable";
import { Command, CommandAuthTypes } from "../Command";

export class DiscordInteractionMessage implements IMessage {
    constructor(endpoint:DiscordEndpoint, message: Discord.ChatInputCommandInteraction<Discord.CacheType>) {
        this.endpoint = endpoint;
        this.msg = message;
    }

    get message(): string {
        return this.msg.commandName + " " + this.msg.options.getString('arguments');
    }

    get from(): IUser {
        return new DiscordUser(this.endpoint, this.msg.user);
    }
    get isDirectMessage(): boolean {
        return this.msg.channel.isDMBased();
    }

    get target(): IUser | IChannel {
        if (this.isDirectMessage) {
            return this.endpoint.me;
        } else {
            return new DiscordChannel(this.endpoint, <Discord.TextChannel>this.msg.channel);
        }
    }

    reply(message: string): void {
        this.msg.reply(message);
    }
    action(message: string): void {
        this.msg.reply("*" + message + "*");
    }
    notice(message: string): void {
        this.msg.reply("__**" + message + "**__");
    }
    part(): void {
        throw new Error("Method not implemented.");
    }
    endpoint: DiscordEndpoint;
    msg: Discord.ChatInputCommandInteraction<Discord.CacheType>;

    get discriminator() : string {
        return "CORE.DiscordMessage";
    }
}
export class DiscordMessage implements IMessage {
    constructor(endpoint:DiscordEndpoint, message:Discord.Message|Discord.PartialMessage) {
        this.endpoint = endpoint;
        this.msg = message;
    }

    get message(): string {
        return this.msg.content;
    }

    get from(): IUser {
        return new DiscordUser(this.endpoint, this.msg.author);
    }
    get isDirectMessage(): boolean {
        return this.msg.channel.type == Discord.ChannelType.DM;
    }

    get target(): IUser | IChannel {
        if (this.isDirectMessage) {
            return this.endpoint.me;
        } else {
            return new DiscordChannel(this.endpoint, <Discord.TextChannel>this.msg.channel);
        }
    }

    reply(message: string): void {
        this.msg.reply(message);
    }
    action(message: string): void {
        this.msg.reply("*" + message + "*");
    }
    notice(message: string): void {
        this.msg.reply("__**" + message + "**__");
    }
    part(): void {
        throw new Error("Method not implemented.");
    }
    endpoint: DiscordEndpoint;
    msg:Discord.Message|Discord.PartialMessage;

    get discriminator() : string {
        return "CORE.DiscordMessage";
    }
}

export class DiscordUser implements IUser {
    constructor(endpoint:DiscordEndpoint, user:Discord.User) {
        this.user = user;
        this.endpoint = endpoint;
    }

    get name(): string {
        return this.user.username;
    }
    
    get account(): string {
        return this.user.id;
    }

    discriminator: string = "CORE.DiscordUser";
    say(message: string): void {
        this.user.send(message); //.sendMessage(message);
    }
    action(message: string): void {
        this.user.send("*" + message + "*");
    }
    endpoint: IEndpoint;
    user:Discord.User;
}

export class DiscordChannel implements IChannel {
    constructor(endpoint:DiscordEndpoint, chann:Discord.TextChannel) {
        this.endpoint = endpoint;
        this.chann = chann;
    }

    users: { [key: string]: IUser; };
    topic: string;
    get name(): string {
        return this.chann.name;
    }

    say(message: string): void {
        this.chann.send(message);
    }

    action(message: string): void {
        this.chann.send("*" + message + "*");
    }
    part(): void {
        throw new Error("Method not implemented.");
    }

    userHasRole(user:IUser, role:string):Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {

            let users = this.chann.members.filter(p => p.id == user.account);

            if (!users || users.size == 0) return resolve(false);
            if (users.first().roles.cache.size == 0) return resolve(false);

            resolve(users.first().roles.cache.filter(p => p.name == role).size > 0);
        });
    }
    
    discriminator: string = "CORE.DiscordChannel";
    endpoint: DiscordEndpoint;
    chann:Discord.TextChannel;
}

export class DiscordEndpoint extends EventEmitter implements IEndpoint {

    get type() : EndpointTypes {
        return EndpointTypes.Discord;
    }
    
    get name() : string {
        return this.config.name || this.type.toString();
    }
    constructor(options:EndpointConfig, authBot:IEndpointBot) {
        super();

        this.config = options;
        this.authBot = authBot;
    }

    async connect(): Promise<void> {
        this.client = new Discord.Client({
            intents: [
                Discord.GatewayIntentBits.Guilds, 
                Discord.GatewayIntentBits.DirectMessages,
                Discord.GatewayIntentBits.MessageContent, 
                Discord.GatewayIntentBits.GuildMessageReactions,
                Discord.GatewayIntentBits.GuildIntegrations,
                Discord.GatewayIntentBits.GuildMessages,
            ]
        });
        this.client.on(Discord.Events.ClientReady, () => {
            this.emit(EndpointEvents.Connected.toString(), this, this.me);
        });
        this.client.on(Discord.Events.MessageCreate, msg => { // 'message'
            let msg2 = new DiscordMessage(this, msg);
            this.emit(EndpointEvents.Message.toString(), this, msg2);
            this.authBot.onMessage(this, msg2);
        });
        this.client.on(Discord.Events.Error, err => {
            console.log("Error ", err);
            if (!this.isConnected) {
                this.client.login(this.config.connectionString[0]);
            }
        });
        this.client.on(Discord.Events.MessageUpdate, (old, newMsg) => {
            let msg2 = new DiscordMessage(this, newMsg);
            this.emit(EndpointEvents.Message.toString(), this, msg2);
            this.authBot.onMessage(this, msg2);
        });
        this.client.on(Discord.Events.InteractionCreate, async interaction => {
            if (!interaction.isChatInputCommand()) return;
            interaction.commandName = "/" + interaction.commandName;
            let msg2 =  new DiscordInteractionMessage(this, interaction);
            this.emit(EndpointEvents.Message.toString(), this, msg2);
            this.authBot.onMessage(this, msg2);
        });
        
        const resp = await this.client.login(this.config.connectionString[0]);

        for(let cmd of this.commandsToRegister) {
            this.callCommandRegister(cmd);
        }
        this.commandsToRegister = [];
    }
    disconnect(): void {
        throw new Error("Method not implemented.");
    }
    get isConnected(): boolean {
        return this.client.isReady();
    }
    join(channel: string | IChannel, key: string): void {
        throw new Error("Method not implemented.");
    }
    part(channel: string | IChannel): void {
        throw new Error("Method not implemented.");
    }
    say(destination: string | IChannel | IUser, message: string): void {
        if (typeof destination === "string") {
            let chan = (<Discord.TextChannel>this.client.channels.cache.get(destination));
            if (!chan) {
                chan = (<Discord.TextChannel>this.client.channels.cache.filter( (v, k, col) => (<Discord.TextChannel>v).name == destination).first());
                if (!chan) throw new Error("Cannot find channel " + destination);
            }

            chan.send(message);
        } else {
            let dest = null;
            // destination HAS to be a discord channel or user
            if (destination.discriminator.indexOf("Channel") > 0) {
                let t = <DiscordChannel>destination;
                dest = (<Discord.TextChannel>this.client.channels.cache.get(t.chann.id));
            }
            else {
                let t = <DiscordUser>destination;
                dest = this.client.users.cache.get(t.user.id);
            }

            dest.send(message);
            
        }
    }
    action(destination: string | IChannel | IUser, message: string): void {
        this.say(destination, "*"+message+"*");
    }
    send(msg: IMessage): void {
        this.say(msg.target, msg.message);
    }

    registerCommand(cmd:Command<IMessage>) {
        try {
            
        let cmdBuilder = new Discord.SlashCommandBuilder()
            .setName(cmd.name)
            .setDescription(cmd.name)
            .addStringOption(option => 
                option.setName('arguments')
                .setDescription('Parameters to pass into command, possibly optional')
                .setRequired(false));

        let roleLimits = cmd.auth.filter(a => a.authType == CommandAuthTypes.Level || a.authType == CommandAuthTypes.Role);

        if (roleLimits.length > 0) {
            for(let roleLimit of roleLimits) {
                switch(roleLimit.authType) {
                    case CommandAuthTypes.Level:
                        if (roleLimit.authValue == '3') {
                            cmdBuilder.setDefaultMemberPermissions(Discord.PermissionFlagsBits.Administrator)
                        }
                        break;
                    case CommandAuthTypes.Role:
                        // Todo: Figure out how to set the right permission here.
                        break;
                }
            }
        }

        if (this.isConnected) {
            this.callCommandRegister(cmdBuilder);
        } else {
            this.commandsToRegister.push(cmdBuilder);
        }
    }
    catch (ex) {
        console.log("register Command error: ", ex);
    }

    }
    
    async callCommandRegister(cmd: Omit<Discord.SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">) {
        await this.client.application.commands.create(cmd);
    }

    deregisterCommand(cmd:Command<IMessage>) {
    }

    get me(): IUser {
        return new DiscordUser(this, this.client.user);
    }
    client:Discord.Client;
    config:EndpointConfig;
    authBot:IEndpointBot;
    commandsToRegister: Omit<Discord.SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">[] = [];
}
