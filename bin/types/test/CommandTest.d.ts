import 'source-map-support/register';
export declare class CommandTests {
    sleep(ms: number): Promise<unknown>;
    userToRoles: {
        [name: string]: string[];
    };
    userToLevels: {
        [name: string]: number;
    };
    tests: {
        (): Promise<void>;
    }[];
    cleanup(): void;
    constructor();
    doTests(): Promise<void>;
}
