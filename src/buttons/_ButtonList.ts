import {Button} from "../interfaces/Button";
import {Collection} from "discord.js";
import {accept} from "./match/accept";

import {draw} from "./match/score/draw";
import {loss} from "./match/score/loss";
import {confirmScore} from "./match/score/confirmScore";
import {score0, score1, score2, score3, score4, score5, score6, score7, score8, score9} from "./match/score/score";
import {win} from "./match/score/win";
import {missing} from "./match/missing";
import {readyAPAC15, readyAPAC30, readyAPAC60, readyAPAC120} from "./queue/SND/ReadyAPAC";
import {readyEU15, readyEU30, readyEU60, readyEU120} from "./queue/SND/ReadyEU";
import {readyFILL15, readyFILL30, readyFILL60, readyFILL120} from "./queue/SND/ReadyFILL";
import {readyNA15, readyNA30, readyNA60, readyNA120} from "./queue/SND/ReadyNA";
import {unready} from "./queue/SND/unready";
import {signup} from "./signup";
import {vote1, vote2, vote3, vote4, vote5, vote6, vote7} from "./match/vote/votes";
import {p2pToggle} from "./p2pToggle";
import {lfg} from "./queue/lfg";
import {stats} from "./queue/stats";
import {games} from "./queue/games";
import {APAC, EUE, EUW, NAE, NAW} from "./regionSelect";
import {pingMeButton} from "./queue/pingMe";

const buttonList: Button[] = [accept, draw, loss, win, confirmScore, score0, score1, score2, score3, score4, score5,
    missing, unready, readyAPAC15, readyAPAC30, readyAPAC60, readyAPAC120, readyEU15, readyEU30, readyEU60, readyEU120,
    readyFILL15, readyFILL30, readyFILL60, readyFILL120, readyNA15, readyNA30, readyNA60, readyNA120, signup, vote1, vote2,
    vote3, vote4, vote5, vote6, vote7, score6, score7, score8, score9, p2pToggle, lfg, stats, games, NAE, NAW, EUE, EUW, APAC,
pingMeButton];
let ButtonMap: Collection<string, Button> = new Collection<string, Button>();

for (let command of buttonList) {
    ButtonMap.set(command.id, command);
}

export const ButtonList = ButtonMap;