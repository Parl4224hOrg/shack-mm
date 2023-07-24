import {Button} from "../../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle} from "discord.js";
import {logError} from "../../../loggers";
import {matchVotes} from "../../../utility/match";
import {voteLimiter} from "../../../utility/limiters";

export const hideout: Button = {
    data: new ButtonBuilder()
        .setLabel('Hideout: 0')
        .setStyle(ButtonStyle.Primary)
        .setCustomId('hideout-vote'),
    run: async (interaction, data) => {
        try {
            await matchVotes(interaction, data);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'hideout-vote',
    limiter: voteLimiter,
}