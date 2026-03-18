import Server from "rcon-pavlov";
import {Regions} from "../database/models/UserModel";
import {releaseServerReservation} from "../utility/server-util";

export class GameServer extends Server {
    public readonly name: string;
    public readonly region: Regions
    public readonly id: string;

    constructor(ip: string, port: number, password: string, name: string, region: Regions, id: string) {
        super(ip, port, password, 8);
        this.name = name;
        this.region = region;
        this.id = id;
    }

    public async registerServer() {
        await this.connect()
    }

    public async unregisterServer() {
        await releaseServerReservation(this.id);
        await this.updateServerName(this.name);
        await this.close();
    }
}
