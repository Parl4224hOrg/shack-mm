import {ActionRowBuilder, MessageActionRowComponentBuilder} from "discord.js";
import {score0, score1, score2, score3, score4, score5} from "../buttons/match/score/score";
import {win} from "../buttons/match/score/win";
import {draw} from "../buttons/match/score/draw";
import {loss} from "../buttons/match/score/loss";
import {confirmScore} from "../buttons/match/score/confirmScore";

export const initialSubmit = () => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(win.data, loss.data, draw.data).toJSON()
}

export const roundsWon = () => {
    const rowA = new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(score0.data, score1.data, score2.data);

    const rowB = new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(score3.data, score4.data, score5.data);


    return [rowA.toJSON(), rowB.toJSON()];
}

export const acceptScore = () => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(confirmScore.data).toJSON()
}