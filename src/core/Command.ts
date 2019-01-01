import {IEvent} from './Events/IEvent';
import {IEndpoint} from './IEndpoint';
import {IMessage} from './Events/IMessage';
import {ILeave} from './Events/ILeave';
import {IChannel} from './IChannel';
import {Bot} from './Bot';
import { IUser } from './IUser';

export class CommandThrottleOptions {
    user : number = -1;
    channel : number = -1;
    endpoint : number = -1;

    constructor(user:number, channel:number, endpoint:number) {
        this.user = user;
        this.channel = channel;
        this.endpoint = endpoint;
    }

    canCommandExecute(lastUser:Date, lastChannel:Date, lastEndpoint:Date) : boolean {
        let canRun = true;        
        let now = new Date();
        
        if (this.user != -1 && lastUser != null) {
            let throttleExpiration = new Date(lastUser);
            throttleExpiration.setSeconds(throttleExpiration.getSeconds() + this.user);
            if (now.getTime() <= throttleExpiration.getTime()) {
                canRun = false;
            }
        }

        if (this.channel != -1 && lastChannel != null) {
            let throttleExpiration = new Date(lastChannel);
            throttleExpiration.setSeconds(throttleExpiration.getSeconds() + this.channel);
            if (now.getTime() <= throttleExpiration.getTime()) {
                canRun = false;
            }
        }

        if (this.endpoint != -1 && lastEndpoint != null) {
            let throttleExpiration = new Date(lastEndpoint);
            throttleExpiration.setSeconds(throttleExpiration.getSeconds() + this.endpoint);
            if (now.getTime() <= throttleExpiration.getTime()) {
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

// Bind to a #channel@endpointName
export class CommandBindOptions {
    binding:string;

    constructor(binding:string) {
        this.binding = binding;
        let parts = this.binding.split("@");

        if (parts.length < 2) {
            throw new Error("Invalid endpoint binding passed: " + this.binding);
        }

        this.parsed = new ParsedEndpointBinding();
        this.parsed.channel = new RegExp(parts[0]);
        this.parsed.endpoint = new RegExp(parts[1]);
    }

    canCommandExecute(event:IEvent) : boolean {
        let target = (event.discriminator.indexOf("Leave") != -1) ? (<ILeave>event).target : [(<IMessage>event).target];

        let allowedRun = false;

        for(let j in target) {
            if (this.parsed.channel.test(target[j].name)) {
                allowedRun = true;
            }
        }

        if (allowedRun && this.parsed.endpoint.test(event.endpoint.name)) {
            return true;
        }

        return false;
    }

    toJSON() {
        return {binding:this.binding};
    }

    private parsed: ParsedEndpointBinding;
}

export enum CommandAuthTypes {
    
    // Their service assigned account name. If they are not identified, their names are empty.
    Account = "account",

    // Uses the built-in auth options. Levels 1-3. All users are level 1 by default. Admin/owner is level 3.
    Level = "level",

    // The "visual" name of the user. NOT SECURE, but easy to validated
    Name = "name",

    // The assigned role of the user.
    Role = "role"
}

export class CommandAuthOptions {
    authType:CommandAuthTypes;
    authValue:string;

    constructor(authType:CommandAuthTypes, authValue:string) {
        this.authType = authType;
        this.authValue = authValue;

        // Due to membership lookup code, we cannot perform regex on roles.
        if (this.authType != CommandAuthTypes.Role) {
            this.authValueRegex = new RegExp(this.authValue);
        }
    }

    async canCommandExecute(event:IEvent) : Promise<boolean> {
        switch(this.authType) {
            case CommandAuthTypes.Account:
                return this.authValueRegex.test(event.from.account);
            case CommandAuthTypes.Level:
                return this.authValueRegex.test(event.endpoint.authBot.isUserAuthed(event).toString());
            case CommandAuthTypes.Name:
                return this.authValueRegex.test(event.from.name);
            case CommandAuthTypes.Role:
            
                // Role auth options are only valid in channel messages= events
                let isMessage = (event.discriminator.indexOf("Message") > 0);
                if (isMessage) {
                    let message = <IMessage>event;
                    if (!message.isDirectMessage) {
                        let result = await (<IChannel>message.target).userHasRole(message.from, this.authValue);
                        return result;
                    }
                }
            break;

        }

        return false;
    }

    toJSON() {
        return {authType:this.authType, authValue:this.authValue};
    }

    private authValueRegex:RegExp;
}

export class Command<EventType extends IEvent> {
    get name() : string {
        return this._name;
    }

    static Deserialize<EventType extends IEvent>(jsonObject:any) : Command<EventType> {
        return new Command(
            jsonObject.name,
            <any>new Function("bot", "message", jsonObject.fnc.replace(/^function\s+anonymous\(bot,message\s*\)\s*{\s*(.*)\s*}$/s, "$1")),
            new CommandThrottleOptions(
                jsonObject.throttle.user, 
                jsonObject.throttle.channel, 
                jsonObject.throttle.endpoint
            ),
            jsonObject.binding.map(p => new CommandBindOptions(p.binding)),
            jsonObject.auth.map(p => new CommandAuthOptions(p.authType, p.authValue)),
            jsonObject.serialize,
            jsonObject.requireCommandPrefix
        );
    }

    constructor(
        name:string, 
        fnc:(Bot,IEvent) => any, 
        throttle:CommandThrottleOptions, 
        binding:CommandBindOptions[], 
        auths:CommandAuthOptions[], 
        serialize:boolean = true,
        requireCommandPrefix = true) 
    {
        this._name = name;
        this.throttle = throttle;
        this.binding = binding;
        this.auth = auths;
        this.fnc = fnc; 
        this.lastUser = new Map<IUser, Date>();
        this.lastEndpoint = new Map<IEndpoint, EndpointTimestampCollection>();
        this.serialize = serialize;
        this.requireCommandPrefix = requireCommandPrefix;
    }

    throttle: CommandThrottleOptions;
    binding: CommandBindOptions[];
    auth: CommandAuthOptions[];

    async execute(bot:Bot, message:EventType) : Promise<boolean> {
        // Since we have 2 ways to execute our fnc, we need to update the timestamp in 2 places.
        // This is nice and easy code sharing.
        let updateTs = () => {
        
            // Update their last used timestamp
            let latest = new Date();
            this.lastUser.set(message.from,latest);
            this.lastEndpoint.get(message.endpoint).updateTimestamp(message, latest);
        };

        let le = this.lastEndpoint.get(message.endpoint);
        if (le == null) {
            le = new EndpointTimestampCollection();
            this.lastEndpoint.set(message.endpoint, le);
        }

        let lastChan = null;
        if (message.discriminator.indexOf("Message") > 0 && (<IMessage><any>message).target.discriminator.indexOf("Channel") > 0) {
            lastChan = le.lastChannel.get(<IChannel>(<IMessage><any>message).target);
        }

        if (this.throttle.canCommandExecute(this.lastUser.get(message.from), lastChan, le.lastEndpoint)) {
            let res = (
                this.binding.length > 0 ? 
                    this.binding.filter(b => b.canCommandExecute(message) === true).length > 0 
                    : true
            );

            if (res) {
                if (this.auth.length > 0) {
                    let res = await Promise.all(this.auth.map(p => p.canCommandExecute(message))).then((values) => {
                        if (values.filter(b => b == true).length > 0) {
                            updateTs();
                            this.fnc(bot, message);
                            return true;
                        }
                        return false;
                    }).catch(p => {
                        console.error("Command.ts error: ", p);
                        throw p;
                    });

                    return res;
                }
                else {
                    updateTs();
                    this.fnc(bot, message);
                    return true;
                }
            }
        }
        
        return false;
    }

    toJSON() {
        return {
            name:this.name, 
            fnc:this.fnc.toString(),
            throttle:this.throttle,
            binding:this.binding,
            auth:this.auth,
            serialize:this.serialize,
            requireCommandPrefix:this.requireCommandPrefix
        };
    }

    toString() : string {
        return "[" + this.name + " Command]";
    }

    lastUser: Map<IUser, Date>;
    lastEndpoint: Map<IEndpoint, EndpointTimestampCollection>;
    serialize: boolean;
    requireCommandPrefix: boolean;

    private _name:string;
    fnc:(Bot, IEvent) => any;
}

class EndpointTimestampCollection {
    lastEndpoint:Date;

    lastChannel: Map<IChannel, Date>;

    constructor() {
        this.lastChannel = new Map<IChannel, Date>();
        this.lastEndpoint = null;
    }

    updateTimestamp(event:IEvent, latest:Date) {
        if (event.discriminator.indexOf("Message") > 0) {
            this.lastChannel.set(<IChannel>(<IMessage><any>event).target,latest);
        }

        this.lastEndpoint = latest;
    }
}

