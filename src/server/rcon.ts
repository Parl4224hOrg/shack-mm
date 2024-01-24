import md5 from "md5";
import * as net from "net";
import {Client} from "discord.js";
import {logWarn} from "../loggers";

export class RCON {
    private readonly address: string;
    private readonly port: number;
    private readonly password: string;
    private socket: null | net.Socket = null;
    protected client: Client;

    constructor(address: string, port: number, password: string, client: Client) {
        this.address = address;
        this.port = port
        this.password = md5(password);
        this.client = client;
    }

    async connect() {
        this.socket = net.createConnection(this.port, this.address, () => {
            this.socket!.write(this.password);
        });
        this.socket!.on('data', (data) => {
            if (data.toString().includes('Authenticated')) {
                if(data.toString().includes('0')) {
                    logWarn("Could not auth to server", this.client);
                    console.log('Wrong password!');
                    return this.close();
                }
                return this.socket!.emit('Authenticated', data.toString());
            }
            if(!data.toString().startsWith('{')) {
                return;
            }
            let json;
            try {
                json = JSON.parse(data.toString());
            } catch (e) {
                logWarn(`Could not parse: \`\`\`${data.toString()}\`\`\``, this.client);
                json = {Command: "error"}
                this.socket!.on("error", (data: any) => {
                    logWarn(data.toString(), this.client);
                    this.close().then(() => {this.connect().then()});
                });
            }
            return this.socket!.emit(json.Command, json);
        });
        this.socket!.on("error", (data: any) => {
            logWarn(data.toString(), this.client);
            this.close().then(() => {this.connect().then()});
        });
    }

    async send(command: string, commandName: string, cb: any) {
        this.socket!.write(command);
        return this.socket?.once(commandName, cb);
    }

    async close(): Promise<void> {
        this.socket!.end()
    }

}