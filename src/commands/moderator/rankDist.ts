import { SubCommand } from "../../interfaces/Command";
import { logError, logSMMInfo } from "../../loggers";
import tokens from "../../tokens";
import StatsModel from "../../database/models/StatsModel";
import { Collection, SlashCommandSubcommandBuilder } from "discord.js";
import { getRank } from "../../utility/ranking";
import { getRankDistGraph } from "../../utility/graph";

export const rankDist: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName("rank_distribution")
        .setDescription("Displays the rank distribution"),
    run: async (interaction) => {
        try {
            await interaction.deferReply();
            const stats = await StatsModel.find({ gamesPlayed: { "$gte": 10 } });
            const totals = new Collection<string, number>();
            totals.set("Wood", 0);
            totals.set("Copper", 0);
            totals.set("Iron", 0);
            totals.set("Bronze", 0);
            totals.set("Silver", 0);
            totals.set("Gold", 0);
            totals.set("Platinum", 0);
            totals.set("Diamond", 0);
            totals.set("Master", 0);
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
            const labels: string[] = []
            const data: string[] = []
            for (let total of totals) {
                labels.push(total[0]);
                data.push((total[1] / totalNumber * 100).toFixed(1));
            }
            await interaction.followUp({ files: [await getRankDistGraph(labels, data)] });

            //log the cmd
            let logMessage = `<@${interaction.user.id}> checked rank distribution.`;
            let modAction = `<@${interaction.user.id}> used rank_distribution`;
            await logSMMInfo(logMessage, interaction.client, modAction);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "rank_distribution",
    allowedRoles: tokens.Mods,
}
