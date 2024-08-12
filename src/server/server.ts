import Server from "rcon-pavlov";
import {Regions} from "../database/models/UserModel";

export class GameServer extends Server {
    private inUse: boolean = false;
    private matchNumber: number = -1;
    public readonly name: string;
    public readonly region: Regions
    public readonly id: string;

    constructor(ip: string, port: number, password: string, name: string, region: Regions, id: string) {
        super(ip, port, password, 8);
        this.name = name;
        this.region = region;
        this.id = id
    }

    public async registerServer(matchNumber: number) {
        await this.connect()
        this.inUse = true;
        this.matchNumber = matchNumber;
    }

    public async unregisterServer() {
        this.inUse = false;
        this.matchNumber = -1;
        await this.updateServerName(this.name);
        await this.close();
    }

    public getMatchNumber(): number {
        return this.matchNumber;
    }

    public isInUse() {
        return this.inUse || this.matchNumber > 0;
    }
}
