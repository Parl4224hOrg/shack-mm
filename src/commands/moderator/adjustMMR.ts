import {SubCommand} from "../../interfaces/Command";
import {mmrOption, userOption} from "../../utility/options";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {getStats} from "../../modules/getters/getStats";
import {updateStats} from "../../modules/updaters/updateStats";
import tokens from "../../tokens";
import {SlashCommandSubcommandBuilder} from "discord.js";

export const adjustMMR: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('adjust_mmr')
        .setDescription("Adjusts a user's mmr by a specified amount")
        .addUserOption(userOption("User to adjust mmr of"))
        .addNumberOption(option => option.setName('mmr_delta').setDescription('Amount to change MMR by').setRequired(true)),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.options.getUser('user', true), data);
            const stats = await getStats(dbUser._id, "SND");
            const mmrDelta = interaction.options.getNumber('mmr_delta', true);
            for (let mmr of stats.mmrHistory) {
                mmr += mmrDelta;
            }
            stats.mmr += mmrDelta;
            await updateStats(stats);
            await interaction.reply({content: `<@${dbUser.id}>'s MMR has been adjusted by ${mmrDelta}. New MMR is ${stats.mmr}.` });
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'adjust_mmr',
    allowedRoles: tokens.Mods,
}
