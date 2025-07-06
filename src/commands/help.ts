import {Command} from "../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {logError} from "../loggers";
import {EmbedBuilder, MessageFlagsBitField} from "discord.js";

export const help: Command = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Displays a list of commands and what they do"),
    run: async (interaction) => {
        try {
            const embed = new EmbedBuilder()
            embed.setTitle("Command Help")
            embed.setDescription("Below is a list of all commands and what they do")
            embed.setFields([
                {
                    name: "abandon",
                    value: "Abandons you from a match",
                    inline: false,
                }, {
                    name: "check_ban",
                    value: "Checks your current ban counter, cooldown, next ban reduction, and freeze status",
                    inline: false,
                },{
                   name: "games",
                    value: "Displays the currently active games",
                    inline: false,
                },{
                    name: "graph",
                    value: "Will display a graph of the user's previous 10 games or the specified amount",
                    inline: false,
                },{
                    name: "lfg",
                    value: "Displays which players are currently in queue to find a game",
                    inline: false,
                },{
                    name: "ping_me",
                    value: "Allows you to tell the bot to ping you when a certain number of players are in queue.\nFor the time option <0 will apply an indefinite ping only removed by bot restarts. 0 will remove your current ping. >1 will apply for the time in minutes provided",
                    inline: false,
                },{
                    name: "ping_players",
                    value: "The bot will ping all players with the P2P role but only every 90 minutes",
                    inline: false,
                },{
                    name: "rating_change",
                    value: "Displays the user's rating change from their previous game only works once 11 games have been played",
                    inline: false,
                },{
                    name: "ready",
                    value: "Allows you to queue for a game with a preset time of 30 minutes or you can choose your own",
                    inline: false,
                },{
                    name: "register",
                    value: "Allows you to play mm by setting your oculus name",
                    inline: false,
                },{
                    name: "set_requeue",
                    value: "Toggles whether you want to be requeued or not automatically due to an abandon within 5 minutes or fail to accept",
                    inline: false,
                },{
                    name: "stats",
                    value: "Displays the user's stats including mmr, win rate, etc",
                    inline: false,
                },{
                    name: "unready",
                    value: "Unreadies you from the selected queue",
                    inline: false,
                },
            ]);
            await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, embeds: [embed.toJSON()]});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "help",
}