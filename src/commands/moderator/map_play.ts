import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {logError} from "../../loggers";
import tokens from "../../tokens";
import GameModel from "../../database/models/GameModel";
import {Collection} from "discord.js";

export const map_play: Command = {
    data: new SlashCommandBuilder()
        .setName("play_rates")
        .setDescription("Show how much each map has been played"),
    run: async (interaction) => {
        try {
            const games = await GameModel.find({scoreB: {"$gte": 0}, scoreA: {'$gte': 0}}).sort({matchId: 1});
            const totals = new Collection<string, number>()
            for (let game of games) {
                const check = totals.get(game.map);
                if (check) {
                    totals.set(game.map, check + 1);
                } else {
                    totals.set(game.map, 1);
                }
            }
            let display = "```Number of times each map has been played\n";
            for (let total of totals) {
                display += `${total[0]}: ${total[1]}\n`;
            }
            display += "```";
            await interaction.reply({content: display});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "play_rates",
    allowedRoles: [tokens.ModRole],
}