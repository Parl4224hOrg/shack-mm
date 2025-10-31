import { SubCommand } from "../../interfaces/Command";
import { MessageFlagsBitField, SlashCommandSubcommandBuilder } from "discord.js";
import { logError, logSMMInfo } from "../../loggers";
import { getMapsDB } from "../../utility/match";
import tokens from "../../tokens";

export const nextMapPool: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName("next_map_pool")
        .setDescription("Displays the maps that are in pool and which will be in the next match"),
    run: async (interaction) => {
        try {
            const maps = await getMapsDB(100);
            let mapMessage = "```---- Maps In Next Game ----";
            let count = 0;
            for (const map of maps) {
                mapMessage += `\n${map.name}, last played in game ${map.lastPlayed}`;
                count++;
                if (count == tokens.VoteSize) {
                    mapMessage += "\n---- Maps Out of Next Game ----\n";
                }
            }
            mapMessage += "```";
            await interaction.reply({ flags: MessageFlagsBitField.Flags.Ephemeral, content: mapMessage });

            //log the cmd
            let logMessage = `<@${interaction.user.id}> checked next map pool.`;
            let modAction = `<@${interaction.user.id}> used next_map_pool`;
            await logSMMInfo(logMessage, interaction.client, modAction);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "next_map_pool",
}