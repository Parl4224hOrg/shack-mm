import {Button} from "../interfaces/Button";
import {Collection} from "discord.js";
import {accept} from "./match/accept";
import {enforcer} from "./match/vote/enforcer";
import {factory} from "./match/vote/factory";
import {hideout} from "./match/vote/hideout";
import {revolter} from "./match/vote/revolter";
import {skyscraper} from "./match/vote/skyscraper";
import {ship} from "./match/vote/ship";
import {draw} from "./match/score/draw";
import {loss} from "./match/score/loss";
import {confirmScore} from "./match/score/confirmScore";
import {score0, score1, score2, score3, score4, score5} from "./match/score/score";
import {win} from "./match/score/win";
import {missing} from "./match/missing";
import {readyAPAC15, readyAPAC30, readyAPAC60, readyAPAC120} from "./queue/SND/ReadyAPAC";
import {readyEU15, readyEU30, readyEU60, readyEU120} from "./queue/SND/ReadyEU";
import {readyFILL15, readyFILL30, readyFILL60, readyFILL120} from "./queue/SND/ReadyFILL";
import {readyNA15, readyNA30, readyNA60, readyNA120} from "./queue/SND/ReadyNA";
import {unready} from "./queue/SND/unready";

const buttonList: Button[] = [accept, enforcer, factory, hideout, revolter, skyscraper, draw, loss, win, confirmScore,
    score0, score1, score2, score3, score4, score5, missing, unready, ship,
    readyAPAC15, readyAPAC30, readyAPAC60, readyAPAC120, readyEU15, readyEU30, readyEU60, readyEU120,
    readyFILL15, readyFILL30, readyFILL60, readyFILL120, readyNA15, readyNA30, readyNA60, readyNA120,
];
let ButtonMap: Collection<string, Button> = new Collection<string, Button>();

for (let command of buttonList) {
    ButtonMap.set(command.id, command);
}

export const ButtonList = ButtonMap;