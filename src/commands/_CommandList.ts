import {Command} from "../interfaces/Command";
import {Collection} from "discord.js";
import {sync} from "./admin/sync";
import {lfg} from "./queue/lfg";
import {prepare} from "./admin/prepare";
import {_queue} from "./admin/Queue/_queue";
import {pingPlayers} from "./queue/pingPlayers";
import {_ready} from "./queue/ready/_ready";
import {unready} from "./queue/unready";
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
import {cooldown} from "./moderator/cooldown";
import {map_play} from "./moderator/map_play";
import {rank_dist} from "./moderator/rank_dist";
import {setRegion} from "./moderator/setRegion";
import {findUser} from "./moderator/findUser";
import {setRequeue} from "./queue/setRequeue";
import {checkBan} from "./checkBan";
import {freeze} from "./moderator/freeze";
import {help} from "./help";
import {easyTime} from "./moderator/easyTime";
import {checkDms} from "./admin/checkDms";
import {dmOptions} from "./dmOptions";


const commandList: Command[] = [sync, lfg, prepare, _queue, _ready, unready, pingPlayers, forceAbandon, abandon,
    stats, manualSubmit, forceScore, graph, reverseCooldown, nullify, register, ratingChange, warn, warnings,
warnRemove, pingMe, echo, games, actions, cooldown, map_play, rank_dist, setRegion, findUser, setRequeue, checkBan,
freeze, help, easyTime, checkDms, dmOptions];
let CommandMap: Collection<string, Command> = new Collection<string, Command>();



for (let command of commandList) {
    CommandMap.set(command.name, command);
}

export const CommandList = CommandMap;
