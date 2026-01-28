import {ActionRowBuilder, MessageActionRowComponentBuilder} from "discord.js";
import {score0, score1, score2, score3, score4, score5, score6, score7, score8, score9} from "../buttons/match/score/score";
import {win} from "../buttons/match/score/win";
import {loss} from "../buttons/match/score/loss";
import {confirmScore} from "../buttons/match/score/confirmScore";
import {autoReady} from "../buttons/match/autoReady";
import {abandonButton} from "../buttons/match/abandon/abandonButton";
import {promptResetGame} from "../buttons/match/reset-game/prompt";
import {promptSwitchMap} from "../buttons/match/switch-map/prompt";

export const initialSubmit = () => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(win.data, loss.data, autoReady.data, abandonButton.data).toJSON();
}

export const initialSubmitServer = () => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(promptResetGame.data, promptSwitchMap.data);
}

export const roundsWon = () => {
    const rowA = new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(score0.data, score1.data, score2.data, score3.data, score4.data);

    const rowB = new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(score5.data, score6.data, score7.data, score8.data, score9.data);


    return [rowA.toJSON(), rowB.toJSON()];
}

export const acceptScore = () => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(confirmScore.data).toJSON()
}

export const scorePromptView = () => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(confirmScore.data, win.data, loss.data, autoReady.data).toJSON()
}