import {SubCommand} from "../../interfaces/Command";
import {logError} from "../../loggers";
import tokens from "../../tokens";
import GameModel from "../../database/models/GameModel";
import {Collection, SlashCommandSubcommandBuilder} from "discord.js";
import {subDays} from "date-fns";


export const mapPlay: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName("map_play_rates")
        .setDescription("Show how much each map has been played")
        .addIntegerOption(option => 
            option.setName("days")
                .setDescription("Number of days to look back")
                .setRequired(true)
        ),
    run: async (interaction) => {
        try {
            await interaction.deferReply();

            // Get the number of days from the interaction
            const days = interaction.options.getInteger("days", true);
            const startDate = subDays(new Date(), days);
            
            const games = await GameModel.find({
                scoreB: {"$gte": 0},
                scoreA: {'$gte': 0},
                creationDate: {"$gte": startDate}
            }).sort({matchId: 1});
            
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
            await interaction.followUp({content: display});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "map_play_rates",
    allowedRoles: tokens.Mods,
}
