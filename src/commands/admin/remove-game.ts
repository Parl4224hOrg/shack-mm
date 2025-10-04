import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import tokens from "../../tokens";
import {logError} from "../../loggers";

export const removeGame: Command = {
    data: new SlashCommandBuilder()
        .setName("remove_game")
        .setDescription("Removes a stuck game from active games")
        .addIntegerOption(option => option.setName("id").setDescription("Game ID to remove")),
    run: async (interaction, data) => {
        try {
            const id = interaction.options.getInteger("id", true);
            const queue = data.getQueue();
            queue.activeGames = queue.activeGames.filter(game => game.matchNumber != id);
            await interaction.reply({content: `Removed ${id} if it was stuck.`});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "remove_game",
    allowedRoles: tokens.Mods.concat(tokens.AdminRole),
}