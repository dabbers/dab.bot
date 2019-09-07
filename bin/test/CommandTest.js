"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const Commands = require("../core/Command");
const TestEndpoint_1 = require("./TestEndpoint");
const TestMessage_1 = require("./TestMessage");
const TestChannel_1 = require("./TestChannel");
const TestUser_1 = require("./TestUser");
class CommandTests {
    constructor() {
        this.userToRoles = {
            "AdminUser": ["administrator"],
            "OperatorUser": ["@", "+"],
            "dab": [],
        };
        this.userToLevels = {
            "dab": 3,
            "TestMod": 2
        };
        this.tests = [
            // Test an "auth" option where only the username dab can use this command. Should pass
            async () => {
                let executed = false;
                let msg = new TestMessage_1.TestMessage({
                    "target": new TestChannel_1.TestChannel({}),
                    "from": new TestUser_1.TestUser({
                        "name": "dab"
                    })
                });
                let cmd = new Commands.Command("test", (bot, msg) => { executed = true; }, new Commands.CommandThrottleOptions(-1, 20, 10), [], [new Commands.CommandAuthOptions(Commands.CommandAuthTypes.Name, "dab")]);
                let res = await cmd.execute(null, msg);
                if (!res || executed == false) {
                    throw new Error("Command not executed");
                }
            },
            // Test an "auth" option where only the username TestUserOnly can use this command. Should fail
            async () => {
                let executed = false;
                let msg = new TestMessage_1.TestMessage({
                    "target": new TestChannel_1.TestChannel({}),
                    "from": new TestUser_1.TestUser({
                        "name": "dab"
                    })
                });
                let cmd = new Commands.Command("test", (bot, msg) => { executed = true; }, new Commands.CommandThrottleOptions(-1, 20, 10), [], [new Commands.CommandAuthOptions(Commands.CommandAuthTypes.Name, "TestUserOnly")]);
                let res = await cmd.execute(null, msg);
                if (res && executed == true) {
                    throw new Error("Command shouldn't have been executed");
                }
            },
            // Test an "auth" option against the account name of the user. Should pass.
            async () => {
                let executed = false;
                let msg = new TestMessage_1.TestMessage({
                    "target": new TestChannel_1.TestChannel({}),
                    "from": new TestUser_1.TestUser({
                        "name": "dab",
                        "account": "1337"
                    })
                });
                let cmd = new Commands.Command("test", (bot, msg) => { executed = true; }, new Commands.CommandThrottleOptions(-1, 20, 10), [], [new Commands.CommandAuthOptions(Commands.CommandAuthTypes.Account, "1337")]);
                let res = await cmd.execute(null, msg);
                if (!res || executed == false) {
                    throw new Error("Command didn't execute");
                }
            },
            // Test an multiple "auth" options against the account name of the user. Should pass.
            async () => {
                let executed = false;
                let msg = new TestMessage_1.TestMessage({
                    "target": new TestChannel_1.TestChannel({}),
                    "from": new TestUser_1.TestUser({
                        "name": "dab",
                        "account": "1337"
                    })
                });
                let cmd = new Commands.Command("test", (bot, msg) => { executed = true; }, new Commands.CommandThrottleOptions(-1, 20, 10), [], [
                    new Commands.CommandAuthOptions(Commands.CommandAuthTypes.Account, "1339"),
                    new Commands.CommandAuthOptions(Commands.CommandAuthTypes.Account, "1337")
                ]);
                let res = await cmd.execute(null, msg);
                if (!res || executed == false) {
                    throw new Error("Command didn't execute");
                }
            },
            // Test an "auth" option against the account name of the user. Should fail.
            async () => {
                let executed = false;
                let msg = new TestMessage_1.TestMessage({
                    "target": new TestChannel_1.TestChannel({}),
                    "from": new TestUser_1.TestUser({
                        "name": "dab",
                        "account": "1337"
                    })
                });
                let cmd = new Commands.Command("test", (bot, msg) => { executed = true; }, new Commands.CommandThrottleOptions(-1, 20, 10), [], [new Commands.CommandAuthOptions(Commands.CommandAuthTypes.Account, "1338")]);
                let res = await cmd.execute(null, msg);
                if (res && executed == true) {
                    throw new Error("Command shouldn't have been executed");
                }
            },
            // Test an "auth" option against the role of a user who doesn't have admin privs. Should not run.
            async () => {
                let executed = false;
                let msg = new TestMessage_1.TestMessage({
                    "target": new TestChannel_1.TestChannel({
                        "userHasRole": (user, role) => {
                            return new Promise((resolve, reject) => {
                                resolve(this.userToRoles[user.name].indexOf(role) != -1);
                            });
                        }
                    }),
                    "from": new TestUser_1.TestUser({
                        "name": "dab",
                        "account": "1337"
                    })
                });
                let cmd = new Commands.Command("test", (bot, msg) => { executed = true; }, new Commands.CommandThrottleOptions(-1, 20, 10), [], [new Commands.CommandAuthOptions(Commands.CommandAuthTypes.Role, "administrator")]);
                let res = await cmd.execute(null, msg);
                if (res && executed == true) {
                    throw new Error("Command shouldn't have been executed");
                }
            },
            // Test an "auth" option against the role of a user with proper roles. Should run.
            async () => {
                let executed = false;
                let msg = new TestMessage_1.TestMessage({
                    "target": new TestChannel_1.TestChannel({
                        "userHasRole": (user, role) => {
                            return new Promise((resolve, reject) => {
                                resolve(this.userToRoles[user.name].indexOf(role) != -1);
                            });
                        }
                    }),
                    "from": new TestUser_1.TestUser({
                        "name": "AdminUser",
                        "account": "1337"
                    }),
                    "isDirectMessage": false
                });
                let cmd = new Commands.Command("test", (bot, msg) => { executed = true; }, new Commands.CommandThrottleOptions(-1, 20, 10), [], [new Commands.CommandAuthOptions(Commands.CommandAuthTypes.Role, "administrator")]);
                let res = await cmd.execute(null, msg);
                if (!res || executed == false) {
                    throw new Error("Command should be executed");
                }
            },
            // Test an "auth" option against the role of a user with proper roles. Should run.
            async () => {
                let executed = false;
                let msg = new TestMessage_1.TestMessage({
                    "target": new TestChannel_1.TestChannel({
                        "userHasRole": (user, role) => {
                            return new Promise((resolve, reject) => {
                                resolve(this.userToRoles[user.name].indexOf(role) != -1);
                            });
                        }
                    }),
                    "from": new TestUser_1.TestUser({
                        "name": "dab",
                        "account": "1337"
                    }),
                    "isDirectMessage": false
                }, new TestEndpoint_1.TestEndpoint({
                    "authBot": {
                        "isUserAuthed": (message) => {
                            return this.userToLevels[message.from.name] || 1;
                        }
                    }
                }));
                let cmd = new Commands.Command("test", (bot, msg) => { executed = true; }, new Commands.CommandThrottleOptions(-1, 20, 10), [], [new Commands.CommandAuthOptions(Commands.CommandAuthTypes.Level, "[2-3]")]);
                let res = await cmd.execute(null, msg);
                if (!res || executed == false) {
                    throw new Error("Command should be executed");
                }
            },
            // Test an "auth" option against the role of a user with proper roles. Should NOT run.
            async () => {
                let executed = false;
                let msg = new TestMessage_1.TestMessage({
                    "target": new TestChannel_1.TestChannel({
                        "userHasRole": (user, role) => {
                            return new Promise((resolve, reject) => {
                                resolve(this.userToRoles[user.name].indexOf(role) != -1);
                            });
                        }
                    }),
                    "from": new TestUser_1.TestUser({
                        "name": "AdminUser",
                        "account": "1337"
                    }),
                    "isDirectMessage": false
                }, new TestEndpoint_1.TestEndpoint({
                    "authBot": {
                        "isUserAuthed": (message) => {
                            return this.userToLevels[message.from.name] || 1;
                        }
                    }
                }));
                let cmd = new Commands.Command("test", (bot, msg) => { executed = true; }, new Commands.CommandThrottleOptions(-1, 20, 10), [], [new Commands.CommandAuthOptions(Commands.CommandAuthTypes.Level, "[2-3]")]);
                let res = await cmd.execute(null, msg);
                if (res && executed == true) {
                    throw new Error("Command should not be executed");
                }
            },
            // Test an antispam measure.
            async () => {
                let executed = false;
                let chan = new TestChannel_1.TestChannel({
                    "userHasRole": (user, role) => {
                        return new Promise((resolve, reject) => {
                            resolve(this.userToRoles[user.name].indexOf(role) != -1);
                        });
                    },
                    "name": "#dab"
                });
                let msg = new TestMessage_1.TestMessage({
                    "target": chan,
                    "from": new TestUser_1.TestUser({
                        "name": "AdminUser"
                    }),
                    "isDirectMessage": false
                }, new TestEndpoint_1.TestEndpoint({
                    "authBot": {
                        "isUserAuthed": (message) => {
                            return this.userToLevels[message.from.name] || 1;
                        }
                    }
                }));
                let cmd = new Commands.Command("test", (bot, msg) => { executed = true; }, new Commands.CommandThrottleOptions(-1, 8, 5), // No per-user limit, per channel limit, and network limit
                [], []);
                let res = await cmd.execute(null, msg);
                if (!res || executed == false) {
                    throw new Error("Command should be executed");
                }
                executed = false;
                await this.sleep(2000); // Sleep 2 seconds
                res = await cmd.execute(null, msg);
                if (res || executed == true) {
                    throw new Error("Command should not be executed so soon");
                }
                executed = false;
                await this.sleep(6500); // Sleep 6.5 seconds
                res = await cmd.execute(null, msg);
                if (!res || executed == false) {
                    throw new Error("Command should be executed again");
                }
            },
            // Test against basic chan@endpoint binding pass
            async () => {
                let executed = false;
                let msg = new TestMessage_1.TestMessage({
                    "target": new TestChannel_1.TestChannel({ "name": "#dab" }),
                    "from": new TestUser_1.TestUser({
                        "name": "AdminUser",
                        "account": "1337"
                    }),
                    "isDirectMessage": false
                }, new TestEndpoint_1.TestEndpoint({}));
                let cmd = new Commands.Command("test", (bot, msg) => { executed = true; }, new Commands.CommandThrottleOptions(-1, -1, -1), [new Commands.CommandBindOptions("#dab@TestEndpoint")], []);
                let res = await cmd.execute(null, msg);
                if (!res || executed == false) {
                    throw new Error("Command shouldbe executed");
                }
            },
            // Test against basic chan@endpoint binding fail
            async () => {
                let executed = false;
                let msg = new TestMessage_1.TestMessage({
                    "target": new TestChannel_1.TestChannel({ "name": "#notdab" }),
                    "from": new TestUser_1.TestUser({
                        "name": "AdminUser",
                        "account": "1337"
                    }),
                    "isDirectMessage": false
                }, new TestEndpoint_1.TestEndpoint({}));
                let cmd = new Commands.Command("test", (bot, msg) => { executed = true; }, new Commands.CommandThrottleOptions(-1, -1, -1), [new Commands.CommandBindOptions("#dab@TestEndpoint")], []);
                let res = await cmd.execute(null, msg);
                if (res && executed == true) {
                    throw new Error("Command shouldbe executed");
                }
            }
        ];
        this.doTests();
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    cleanup() {
    }
    async doTests() {
        let failures = 0;
        await Promise.all(this.tests.map(p => p())).then(() => {
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
exports.CommandTests = CommandTests;
new CommandTests();
//# sourceMappingURL=CommandTest.js.map