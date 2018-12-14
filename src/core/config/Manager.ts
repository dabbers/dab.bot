export enum ManagerTypes {
    Login, // Login with user/pass
    Nickname, // Anyone with this name/nickname is authenticated. On IRC this nickname must be authenticated with IRC services
    Permission, // Anyone with a channel level permission is authorized
    Operator, // Any server operator has this permission
};

export class Manager {
    type: ManagerTypes;
    
    nickname:string;
    password:string;


    channel:string;
    permission:string;
};
