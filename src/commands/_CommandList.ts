import {Command} from "../interfaces/Command";
import {Collection} from "discord.js";
import {sync} from "./admin/sync";
import {lfg} from "./queue/lfg";
import {prepare} from "./admin/prepare";
import {_queue} from "./admin/Queue/_queue";
import {pingPlayers} from "./queue/pingPlayers";
import {ready} from "./queue/ready";
import {unready} from "./queue/unready";


const commandList: Command[] = [sync, lfg, prepare, _queue, ready, unready, pingPlayers];
let CommandMap: Collection<string, Command> = new Collection<string, Command>();



for (let command of commandList) {
    CommandMap.set(command.name, command);
}



export const CommandList = CommandMap;
