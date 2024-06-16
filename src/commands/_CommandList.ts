import {Command} from "../interfaces/Command";
import {Collection} from "discord.js";
import {sync} from "./admin/sync";
import {lfg} from "./queue/lfg";
import {prepare} from "./admin/prepare";
import {_queue} from "./admin/Queue/_queue";
import {pingPlayers} from "./queue/pingPlayers";
import {_ready} from "./queue/ready/_ready";
import {unready} from "./queue/unready";
import {abandon} from "./match/abandon";
import {stats} from "./queue/stats";
import {manualSubmit} from "./admin/manualSubmit";
import {graph} from "./queue/graph";
import {register} from "./register";
import {ratingChange} from "./queue/ratingChange";
import {pingMe} from "./queue/pingMe";
import {echo} from "./admin/echo";
import {games} from "./queue/games";
import {setRequeue} from "./queue/setRequeue";
import {checkBan} from "./checkBan";
import {help} from "./help";
import {checkDms} from "./admin/checkDms";
import {dmOptions} from "./dmOptions";
import {_mod} from "./moderator/_mod";
import {serverStatus} from "./admin/serverStatus";
import {late} from "./moderator/late";
import {categoryDelete} from "./admin/categoryDelete";
import {unregisterServer} from "./admin/unregisterServer";
import {ping} from "./ping";
import {fixCDs} from "./admin/fixCDs";
import {unmute} from "./admin/unmute";
import {updateMatchScore} from "./moderator/updateMatchScore";

const commandList: Command[] = [sync, lfg, prepare, _queue, _ready, unready, pingPlayers, abandon,
    stats, manualSubmit, graph, register, ratingChange, pingMe, echo, games, setRequeue, checkBan,
    help, checkDms, dmOptions, _mod, serverStatus, late, categoryDelete, unregisterServer, ping, fixCDs, unmute, updateMatchScore];
let CommandMap: Collection<string, Command> = new Collection<string, Command>();



for (let command of commandList) {
    CommandMap.set(command.name, command);
}

export const CommandList = CommandMap;
