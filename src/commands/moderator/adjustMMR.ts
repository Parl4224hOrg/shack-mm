import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {mmrOption, userOption} from "../../utility/options";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {getStats} from "../../modules/getters/getStats";
import {updateStats} from "../../modules/updaters/updateStats";
import tokens from "../../tokens";

export const adjustMMR: Command = {
    data: new SlashCommandBuilder()
        .setName('adjust_mmr')
        .setDescription("Adjusts a user's mmr")
        .addUserOption(userOption("User to adjust mmr of"))
        .addNumberOption(mmrOption),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.options.getUser('user', true), data);
            const stats = await getStats(dbUser._id, "SND");
            const newMMR = interaction.options.getNumber('mmr', true);
            const diff = newMMR - stats.mmr;
            for (let mmr of stats.mmrHistory) {
                mmr += diff;
            }
            stats.mmr = newMMR;
            await updateStats(stats);
            await interaction.reply({ephemeral: true, content: `<@${dbUser.id}>'s mmr has been adjusted to ${newMMR}`});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'adjust_mmr',
    allowedRoles: tokens.Mods,
}