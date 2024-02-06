import {RCON} from "./rcon";
import {
    InspectAllResponse,
    InspectPlayerResponse,
    InspectTeamResponse, KickResponse, PauseMatchResponse,
    RefreshListResponse,
    ResetSNDResponse, RotateMapResponse, ServerInfoResponse, SetPinResponse, SwitchMapResponse, UpdateServerNameResponse
} from "./rconTypes";
import {Client} from "discord.js";

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

export class Server extends RCON {
    private inUse: boolean;
    private matchId: number = -1;
    readonly name: string;


    constructor(ip: string, rconPort: number, rconPassword: string, name: string, client: Client) {
        super(ip, rconPort, rconPassword, client)
        this.inUse = false;
        this.name = name;
        this.connect().then();
    }

    getMatchId() {
        return this.matchId;
    }

    getName() {
        return this.name;
    }

    isInUse() {
        return this.inUse;
    }

    async inspectAll(): Promise<InspectAllResponse> {
        let res: any = {};
        let count = 0;
        await this.send("InspectAll",  "InspectAll",(response: any) => {res = response});
        while (res == '' && count < 60) {
            await delay(50);
            count++;
        }
        return res;
    }

    async inspectPlayer(id: string): Promise<InspectPlayerResponse> {
        let res: any = {};
        let count = 0;
        await this.send(`InspectPlayer ${id}`,  "InspectPlayer",(response: any) => {res = response});
        while (res == '' && count < 60) {
            await delay(50);
            count++;
        }
        return res;
    }

    async inspectTeam(team: string): Promise<InspectTeamResponse> {
        let res: any = {};
        let count = 0;
        await this.send(`InspectTeam ${team}`,  "InspectTeam",(response: any) => {res = response});
        while (res == '' && count < 60) {
            await delay(50);
            count++;
        }
        return res;
    }

    async refreshList(): Promise<RefreshListResponse> {
        let res: any = {};
        let count = 0;
        await this.send("RefreshList",  "RefreshList",(response: any) => {res = response});
        while (res == '' && count < 60) {
            await delay(50);
            count++;
        }
        return res;
    }

    async resetSND(): Promise<ResetSNDResponse> {
        let res: any = {};
        let count = 0;
        await this.send("ResetSND",  "ResetSND",(response: any) => {res = response});
        while (res == '' && count < 60) {
            await delay(50);
            count++;
        }
        return res;
    }

    async pauseMatch(time: number = -1): Promise<PauseMatchResponse> {
        let res: any = {};
        let count = 0;
        if (time < 0) {
            await this.send("PauseMatch",  "PauseMatch",(response: any) => {res = response});
        } else {
            await this.send(`PauseMatch ${time}`, "PauseMatch",(response: any) => {res = response});
        }
        while (res == '' && count < 60) {
            await delay(50);
            count++;
        }
        return res;
    }

    async rotateMap(): Promise<RotateMapResponse> {
        let res: any = {};
        let count = 0;
        await this.send("RotateMap", "RotateMap",(response: any) => {res = response});
        while (res == '' && count < 60) {
            await delay(50);
            count++;
        }
        return res;
    }

    async serverInfo(): Promise<ServerInfoResponse> {
        let res: any = {};
        let count = 0;
        await this.send("ServerInfo", "ServerInfo",(response: any) => {res = response});
        while (res == '' && count < 60) {
            await delay(50);
            count++;
        }
        return res;
    }

    async setPin(pin: number): Promise<SetPinResponse> {
        let res: any = {};
        let count = 0;
        await this.send(`SetPin ${pin}`, "SetPin",(response: any) => {res = response});
        while (res == '' && count < 60) {
            await delay(50);
            count++;
        }
        return res;
    }

    async switchMap(mapId: string, gamemode: string): Promise<SwitchMapResponse> {
        let res: any = {};
        let count = 0;
        await this.send(`SwitchMap ${mapId} ${gamemode}`, "SwitchMap",(response: any) => {res = response});
        while (res == '' && count < 60) {
            await delay(50);
            count++;
        }
        return res;
    }

    async updateServerName(name: string): Promise<UpdateServerNameResponse> {
        let res: any = {};
        let count = 0;
        await this.send(`UpdateServerName ${name}`, "UpdateServerName",(response: any) => {res = response});
        while (res == '' && count < 60) {
            await delay(50);
            count++;
        }
        return res;
    }

    async kick(id: string): Promise<KickResponse> {
        let res: any = {};
        let count = 0;
        await this.send(`Kick ${id}`, "Kick",(response: any) => {res = response});
        while (res == '' && count < 60) {
            await delay(50);
            count++;
        }
        return res;
    }

    registerGame(matchId: number) {
        this.inUse = true;
        this.matchId = matchId;
    }

    unregisterGame() {
        this.inUse = false;
        this.matchId = -1;
    }
}