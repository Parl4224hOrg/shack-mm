import {Command} from "../interfaces/Command";
import {Collection} from "discord.js";
import {sync} from "./admin/sync";
import {lfg} from "./queue/lfg";
import {prepare} from "./admin/prepare";
import {_queue} from "./admin/Queue/_queue";
import {pingPlayers} from "./queue/pingPlayers";
import {ready} from "./queue/ready";
import {unready} from "./queue/unready";
import {cooldown} from "./moderator/cooldown";
import {forceAbandon} from "./moderator/forceAbandon";
import {nullify} from "./moderator/nullify";
import {reverseCooldown} from "./moderator/reverseCooldown";
import {abandon} from "./match/abandon";


const commandList: Command[] = [sync, lfg, prepare, _queue, ready, unready, pingPlayers, cooldown, forceAbandon, nullify, reverseCooldown, abandon];
let CommandMap: Collection<string, Command> = new Collection<string, Command>();



for (let command of commandList) {
    CommandMap.set(command.name, command);
}



export const CommandList = CommandMap;
