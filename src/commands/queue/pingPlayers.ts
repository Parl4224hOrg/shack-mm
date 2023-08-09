import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {logError} from "../../loggers";
import moment from "moment";
import tokens from "../../tokens";
import {grammaticalTime} from "../../utility/grammatical";

export const pingPlayers: Command = {
    data: new SlashCommandBuilder()
        .setName('ping_players')
        .setDescription('Pings players who have opted in'),
    run: async (interaction, data) => {
        try {
            if (moment().unix() >= data.nextPing) {
                await interaction.reply({ephemeral: false, content: `<@&${tokens.PingToPlayRole}> players are looking for a match`, allowedMentions: {roles: [tokens.PingToPlayRole]}});
                data.nextPing = moment().unix() + tokens.PingToPlayTime;
            } else {
                await interaction.reply({ephemeral: true, content: `You cannot ping players for another ${grammaticalTime(data.nextPing - moment().unix())}`})
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'ping_players',
}