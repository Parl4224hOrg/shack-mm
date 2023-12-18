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
import {stats} from "./queue/stats";
import {manualSubmit} from "./admin/manualSubmit";
import {forceScore} from "./moderator/forceScore";
import {graph} from "./queue/graph";
import {register} from "./register";
import {ratingChange} from "./queue/ratingChange";
import {warn} from "./moderator/warn";
import {warnings} from "./moderator/warnings";
import {warnRemove} from "./moderator/warnRemove";
import {pingMe} from "./queue/pingMe";
import {echo} from "./admin/echo";
import {games} from "./queue/games";
import {actions} from "./moderator/actions";
import {autoCD} from "./moderator/autoCD";
import {map_play} from "./moderator/map_play";
import {rank_dist} from "./moderator/rank_dist";


const commandList: Command[] = [sync, lfg, prepare, _queue, _ready, unready, pingPlayers, cooldown, forceAbandon, abandon,
    stats, manualSubmit, forceScore, graph, reverseCooldown, nullify, register, ratingChange, warn, warnings,
warnRemove, pingMe, echo, games, actions, autoCD, map_play, rank_dist];
let CommandMap: Collection<string, Command> = new Collection<string, Command>();



for (let command of commandList) {
    CommandMap.set(command.name, command);
}

export const CommandList = CommandMap;
