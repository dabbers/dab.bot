import 'source-map-support/register';
import * as Commands from '../core/Command';
import {TestEndpoint} from './TestEndpoint';
import {TestMessage} from './TestMessage';
import {TestChannel} from './TestChannel';
import { IUser } from '../core/IUser';
import { TestUser } from './TestUser';
import { IEvent } from '../core/Events/IEvent';

export class CommandTests {
    
    sleep(ms:number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    userToRoles: {[name:string]:string[]} = {
        "AdminUser": ["administrator"],
        "OperatorUser": ["@", "+"],
        "dab":[],
    };

    userToLevels: {[name:string]:number} = {
        "dab":3,
        "TestMod":2
    };

    tests: { (): Promise<void> }[] = [

        // Test an "auth" option where only the username dab can use this command. Should pass
        async () : Promise<void> => {
            let executed: boolean = false;

            let msg = new TestMessage({
                "target": new TestChannel({}),
                "from": new TestUser({
                    "name":"dab"
                })
            });
            
            let cmd = new Commands.Command(
                "test", 
                (bot, msg) => {executed = true;}, 
                new Commands.CommandThrottleOptions(-1, 20, 10), 
                [], 
                [new Commands.CommandAuthOptions(Commands.CommandAuthTypes.Name, "dab")]
            );
            
            let res = await cmd.execute(null, msg);

            if (!res || <any>executed == false) {
                throw new Error("Command not executed");
            }
            
        },
        
        // Test an "auth" option where only the username TestUserOnly can use this command. Should fail
        async () : Promise<void> => {
            let executed: boolean = false;

            let msg = new TestMessage({
                "target": new TestChannel({}),
                "from": new TestUser({
                    "name":"dab"
                })
            });
            
            let cmd = new Commands.Command(
                "test", 
                (bot, msg) => {executed = true;}, 
                new Commands.CommandThrottleOptions(-1, 20, 10), 
                [], 
                [new Commands.CommandAuthOptions(Commands.CommandAuthTypes.Name, "TestUserOnly")]
            );
            
            let res = await cmd.execute(null, msg);

            if (res && <any>executed == true) {
                throw new Error("Command shouldn't have been executed");
            }
        },
        
        // Test an "auth" option against the account name of the user. Should pass.
        async () : Promise<void> => {
            let executed: boolean = false;

            let msg = new TestMessage({
                "target": new TestChannel({}),
                "from": new TestUser({
                    "name":"dab",
                    "account":"1337"
                })
            });
            
            let cmd = new Commands.Command(
                "test", 
                (bot, msg) => {executed = true;}, 
                new Commands.CommandThrottleOptions(-1, 20, 10), 
                [], 
                [new Commands.CommandAuthOptions(Commands.CommandAuthTypes.Account, "1337")]
            );

            let res = await cmd.execute(null, msg);

            if (!res || <any>executed == false) {
                throw new Error("Command didn't execute");
            }
        },
        
        // Test an multiple "auth" options against the account name of the user. Should pass.
        async () : Promise<void> => {
            let executed: boolean = false;

            let msg = new TestMessage({
                "target": new TestChannel({}),
                "from": new TestUser({
                    "name":"dab",
                    "account":"1337"
                })
            });
            
            let cmd = new Commands.Command(
                "test", 
                (bot, msg) => {executed = true;}, 
                new Commands.CommandThrottleOptions(-1, 20, 10), 
                [], 
                [
                    new Commands.CommandAuthOptions(Commands.CommandAuthTypes.Account, "1339"),
                    new Commands.CommandAuthOptions(Commands.CommandAuthTypes.Account, "1337")
                ]
            );
            
            let res = await cmd.execute(null, msg);

            if (!res || <any>executed == false) {
                throw new Error("Command didn't execute");
            }
        },
        
        // Test an "auth" option against the account name of the user. Should fail.
        async () : Promise<void> => {
            let executed: boolean = false;

            let msg = new TestMessage({
                "target": new TestChannel({}),
                "from": new TestUser({
                    "name":"dab",
                    "account":"1337"
                })
            });
            
            let cmd = new Commands.Command(
                "test", 
                (bot, msg) => {executed = true;}, 
                new Commands.CommandThrottleOptions(-1, 20, 10), 
                [], 
                [new Commands.CommandAuthOptions(Commands.CommandAuthTypes.Account, "1338")]
            );
            
            let res = await cmd.execute(null, msg);

            if (res && <any>executed == true) {
                throw new Error("Command shouldn't have been executed");
            }
        },
        
        // Test an "auth" option against the role of a user who doesn't have admin privs. Should not run.
        async () : Promise<void> => {
            let executed: boolean = false;

            let msg = new TestMessage({
                "target": new TestChannel({
                    "userHasRole": (user:IUser, role:string) : Promise<boolean> => {
                        return new Promise<boolean>((resolve, reject) => {
                            resolve(this.userToRoles[user.name].indexOf(role) != -1);
                        })
                    }
                }),
                "from": new TestUser({
                    "name":"dab",
                    "account":"1337"
                })
            });
            
            let cmd = new Commands.Command(
                "test", 
                (bot, msg) => {executed = true;}, 
                new Commands.CommandThrottleOptions(-1, 20, 10), 
                [], 
                [new Commands.CommandAuthOptions(Commands.CommandAuthTypes.Role, "administrator")]
            );
            
            let res = await cmd.execute(null, msg);

            if (res && <any>executed == true) {
                throw new Error("Command shouldn't have been executed");
            }
        },
        
        // Test an "auth" option against the role of a user with proper roles. Should run.
        async () : Promise<void> => {
            let executed: boolean = false;

            let msg = new TestMessage({
                "target": new TestChannel({
                    "userHasRole": (user:IUser, role:string) : Promise<boolean> => {
                        return new Promise<boolean>((resolve, reject) => {
                            resolve(this.userToRoles[user.name].indexOf(role) != -1);
                        })
                    }
                }),
                "from": new TestUser({
                    "name":"AdminUser",
                    "account":"1337"
                }),
                "isDirectMessage": false
            });
            
            let cmd = new Commands.Command(
                "test", 
                (bot, msg) => {executed = true;}, 
                new Commands.CommandThrottleOptions(-1, 20, 10), 
                [], 
                [new Commands.CommandAuthOptions(Commands.CommandAuthTypes.Role, "administrator")]
            );
            
            let res = await cmd.execute(null, msg);

            if (!res || <any>executed == false) {
                throw new Error("Command should be executed");
            }
        },
        
        // Test an "auth" option against the role of a user with proper roles. Should run.
        async () : Promise<void> => {
            let executed: boolean = false;

            let msg = new TestMessage({
                "target": new TestChannel({
                    "userHasRole": (user:IUser, role:string) : Promise<boolean> => {
                        return new Promise<boolean>((resolve, reject) => {
                            resolve(this.userToRoles[user.name].indexOf(role) != -1);
                        })
                    }
                }),
                "from": new TestUser({
                    "name":"dab",
                    "account":"1337"
                }),
                "isDirectMessage": false
                },
                new TestEndpoint({
                    "authBot": {
                        "isUserAuthed": (message:IEvent):number => {
                            return this.userToLevels[message.from.name] || 1;
                        }
                    }
                })
            );
            
            let cmd = new Commands.Command(
                "test", 
                (bot, msg) => {executed = true;}, 
                new Commands.CommandThrottleOptions(-1, 20, 10), 
                [], 
                [new Commands.CommandAuthOptions(Commands.CommandAuthTypes.Level, "[2-3]")]
            );
            
            let res = await cmd.execute(null, msg);

            if (!res || executed == false) {
                throw new Error("Command should be executed");
            }
        },
        
        // Test an "auth" option against the role of a user with proper roles. Should NOT run.
        async () : Promise<void> => {
            let executed: boolean = false;

            let msg = new TestMessage({
                "target": new TestChannel({
                    "userHasRole": (user:IUser, role:string) : Promise<boolean> => {
                        return new Promise<boolean>((resolve, reject) => {
                            resolve(this.userToRoles[user.name].indexOf(role) != -1);
                        })
                    }
                }),
                "from": new TestUser({
                    "name":"AdminUser",
                    "account":"1337"
                }),
                "isDirectMessage": false
                },
                new TestEndpoint({
                    "authBot": {
                        "isUserAuthed": (message:IEvent):number => {
                            return this.userToLevels[message.from.name] || 1;
                        }
                    }
                })
            );
            
            let cmd = new Commands.Command(
                "test", 
                (bot, msg) => {executed = true;}, 
                new Commands.CommandThrottleOptions(-1, 20, 10), 
                [], 
                [new Commands.CommandAuthOptions(Commands.CommandAuthTypes.Level, "[2-3]")]
            );
            
            let res = await cmd.execute(null, msg);

            if (res && <any>executed == true) {
                throw new Error("Command should not be executed");
            }
        },
        
        // Test an antispam measure.
        async () : Promise<void> => {
            let executed: boolean = false;
            let chan = new TestChannel({
                "userHasRole": (user:IUser, role:string) : Promise<boolean> => {
                    return new Promise<boolean>((resolve, reject) => {
                        resolve(this.userToRoles[user.name].indexOf(role) != -1);
                    })
                },
                "name":"#dab"
            });

            let msg = new TestMessage({
                "target": chan,
                "from": new TestUser({
                    "name":"AdminUser"
                }),
                "isDirectMessage": false
                },
                new TestEndpoint({
                    "authBot": {
                        "isUserAuthed": (message:IEvent):number => {
                            return this.userToLevels[message.from.name] || 1;
                        }
                    }
                })
            );
            
            let cmd = new Commands.Command(
                "test", 
                (bot, msg) => {executed = true;}, 
                new Commands.CommandThrottleOptions(-1, 8, 5), // No per-user limit, per channel limit, and network limit
                [], 
                []
            );
            
            let res = await cmd.execute(null, msg);

            if (!res || executed == false) {
                throw new Error("Command should be executed");
            }

            executed = false;
            await this.sleep(2000); // Sleep 2 seconds
            
            res = await cmd.execute(null, msg);
            if (res || <any>executed == true) {
                throw new Error("Command should not be executed so soon");
            }

            executed = false;
            await this.sleep(6500); // Sleep 6.5 seconds
            
            res = await cmd.execute(null, msg);
            if (!res || <any>executed == false) {
                throw new Error("Command should be executed again");
            }
        },
        
        // Test against basic chan@endpoint binding pass
        async () : Promise<void> => {
            let executed: boolean = false;

            let msg = new TestMessage({
                "target": new TestChannel({"name":"#dab"}),
                "from": new TestUser({
                    "name":"AdminUser",
                    "account":"1337"
                }),
                "isDirectMessage": false
                },
                new TestEndpoint({})
            );
            
            let cmd = new Commands.Command(
                "test", 
                (bot, msg) => {executed = true;}, 
                new Commands.CommandThrottleOptions(-1, -1, -1), 
                [new Commands.CommandBindOptions("#dab@TestEndpoint")], 
                []
            );
            
            let res = await cmd.execute(null, msg);

            if (!res || <any>executed == false) {
                throw new Error("Command shouldbe executed");
            }
        },
        
        // Test against basic chan@endpoint binding fail
        async () : Promise<void> => {
            let executed: boolean = false;

            let msg = new TestMessage({
                "target": new TestChannel({"name":"#notdab"}),
                "from": new TestUser({
                    "name":"AdminUser",
                    "account":"1337"
                }),
                "isDirectMessage": false
                },
                new TestEndpoint({})
            );
            
            let cmd = new Commands.Command(
                "test", 
                (bot, msg) => {executed = true;}, 
                new Commands.CommandThrottleOptions(-1, -1, -1), 
                [new Commands.CommandBindOptions("#dab@TestEndpoint")], 
                []
            );
            
            let res = await cmd.execute(null, msg);

            if (res && <any>executed == true) {
                throw new Error("Command shouldbe executed");
            }
        }
    ];

    cleanup() : void {
    }

    constructor()  {
        this.doTests();
    }

    async doTests() {
        let failures = 0;

        await Promise.all(this.tests.map(p => p())).then( () => {
            console.log("DO TESTS");

            if (failures == 0) {
                console.log("All tests passed!");
            }
            else {
                console.log("Found " + failures.toString() + " failures");
            }

        }).catch((reason) => {
            failures++;
            console.error(reason);
        });
        

    }
}

new CommandTests();

