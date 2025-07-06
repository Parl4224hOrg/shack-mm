import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {logError} from "../../loggers";
import moment from "moment";
import tokens from "../../tokens";
import {grammaticalTime} from "../../utility/grammatical";
import {MessageFlagsBitField} from "discord.js";

export const pingPlayers: Command = {
    data: new SlashCommandBuilder()
        .setName('ping_players')
        .setDescription('Pings players who have opted in'),
    run: async (interaction, data) => {
        try {
            if (moment().unix() >= data.nextPing) {
                await interaction.reply({content: `<@&${tokens.PingToPlayRole}> players are looking for a match`, allowedMentions: {roles: [tokens.PingToPlayRole]}});
                data.nextPing = moment().unix() + tokens.PingToPlayTime;
            } else {
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: `You cannot ping players for another ${grammaticalTime(data.nextPing - moment().unix())}`})
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'ping_players',
    allowedChannels: [tokens.SNDChannel],
}