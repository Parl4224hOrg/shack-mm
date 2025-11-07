import {SubCommand} from "../../interfaces/Command";
import {logError} from "../../loggers";
import tokens from "../../tokens";
import GameModel from "../../database/models/GameModel";
import {Collection, SlashCommandSubcommandBuilder} from "discord.js";

export const mapPlay: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName("play_rates")
        .setDescription("Show how much each map has been played")
        .addIntegerOption(option => 
            option.setName("days")
                .setDescription("Number of days to look back")
                .setRequired(false)),
    run: async (interaction) => {
        try {
            await interaction.deferReply();
            const days = interaction.options.getInteger("days");
            let query: any = {scoreB: {"$gte": 0}, scoreA: {'$gte': 0}};
            let dateRange = "";
            if (days) {
                const date = new Date();
                date.setDate(date.getDate() - days);
                query = {...query, creationDate: {"$gte": Math.floor(date.getTime() / 1000)}}; // Convert to seconds
                dateRange = ` (Last ${days} days)`;
            }
            const games = await GameModel.find(query).sort({matchId: 1});
            const totals = new Collection<string, number>();
            for (let game of games) {
                const check = totals.get(game.map);
                if (check) {
                    totals.set(game.map, check + 1);
                } else {
                    totals.set(game.map, 1);
                }
            }
            let display = `\`\`\`Number of times each map has been played${dateRange}\n`;
            for (let total of totals) {
                display += `${total[0]}: ${total[1]}\n`;
            }
            display += "```";
            await interaction.followUp({content: display});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "play_rates",
    allowedRoles: tokens.Mods,
}
