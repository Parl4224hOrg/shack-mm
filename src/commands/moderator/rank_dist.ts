import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {logError} from "../../loggers";
import tokens from "../../tokens";
import StatsModel from "../../database/models/StatsModel";
import {Collection} from "discord.js";
import {getRank} from "../../utility/ranking";

export const rank_dist: Command = {
    data: new SlashCommandBuilder()
        .setName("rank_distribution")
        .setDescription("Displays the rank distribution"),
    run: async (interaction) => {
        try {
            const stats = await StatsModel.find({gamesPlayed: {"$gte": 10}});
            const totals = new Collection<string, number>();
            let totalNumber = 0;
            for (let stat of stats) {
                const rank = getRank(stat.mmr);
                const check = totals.get(rank.name);
                if (check) {
                    totals.set(rank.name, check + 1);
                } else {
                    totals.set(rank.name, 1);
                }
                totalNumber++;
            }
            let display = "```Ranks with number and percentage\n";
            for (let total of totals) {
                display += `${total[0]}: ${total[1]}-${((total[1] / totalNumber) * 100).toFixed(2)}%\n`;
            }
            display += "```";
            await interaction.reply({ephemeral: true, content: display});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "rank_distribution",
    allowedRoles: [tokens.ModRole],
}