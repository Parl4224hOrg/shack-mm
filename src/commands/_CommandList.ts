import {Command} from "../interfaces/Command";
import {Collection} from "discord.js";
import {sync} from "./admin/sync";
import {lfg} from "./queue/lfg";
import {prepare} from "./admin/prepare";
import {_queue} from "./admin/Queue/_queue";
import {pingPlayers} from "./queue/pingPlayers";
import {_ready} from "./queue/ready/_ready";
import {unready} from "./queue/unready";
import {cooldown} from "./moderator/cooldown";
import {forceAbandon} from "./moderator/forceAbandon";
import {nullify} from "./moderator/nullify";
import {reverseCooldown} from "./moderator/reverseCooldown";
import {abandon} from "./match/abandon";
import {_transparency} from "./moderator/_transparency";
import {stats} from "./queue/stats";
import {sendMatchEmbed} from "./admin/sendMatchEmbed";
import {forceScore} from "./moderator/forceScore";


const commandList: Command[] = [sync, lfg, prepare, _queue, _ready, unready, pingPlayers, cooldown, forceAbandon, nullify, reverseCooldown, abandon, _transparency, stats, sendMatchEmbed, forceScore];
let CommandMap: Collection<string, Command> = new Collection<string, Command>();



for (let command of commandList) {
    CommandMap.set(command.name, command);
}

export const CommandList = CommandMap;
