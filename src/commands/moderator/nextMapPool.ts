import {SubCommand} from "../../interfaces/Command";
import {SlashCommandSubcommandBuilder} from "discord.js";
import {logError} from "../../loggers";
import {getOrderedMaps} from "../../utility/match";
import tokens from "../../tokens";

export const nextMapPool: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName("next_map_pool")
        .setDescription("Displays the maps that are in pool and which will be in the next match"),
    run: async (interaction, data) => {
        try {
            const maps = getOrderedMaps(data);
            let mapMessage = "```---- Maps In Next Game ----";
            let count = 0;
            for (const map of maps) {
                mapMessage += `\n${map.mapName}, last played in game ${map.lastGame}`;
                count++;
                if (count == tokens.VoteSize) {
                    mapMessage += "\n---- Maps Out of Next Game ----\n";
                }
            }
            mapMessage += "```";
            await interaction.reply({ephemeral: true, content: mapMessage});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "next_map_pool",
}