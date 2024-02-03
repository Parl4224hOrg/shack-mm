import {SubCommand} from "../../../interfaces/Command";
import {SlashCommandNumberOption, SlashCommandSubcommandBuilder} from "discord.js";
import {userOption} from "../../../utility/options";
import {logError} from "../../../loggers";
import {getUserByUser} from "../../../modules/getters/getUser";
import {getStats} from "../../../modules/getters/getStats";
import tokens from "../../../tokens";
import {updateStats} from "../../../modules/updaters/updateStats";

export const setMMR: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('set_mmr')
        .setDescription("sets a player's mmr")
        .addUserOption(userOption("User to set mmr of"))
        .addNumberOption(new SlashCommandNumberOption()
            .setName('mmr')
            .setDescription("MMR to set player's to")
            .setRequired(true)),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.options.getUser('user', true), data);
            const stats = await getStats(dbUser._id, "SND");
            const currentMMR = stats.mmr;
            const mmrDiff = interaction.options.getNumber('mmr', true) - currentMMR;
            const newHist: number[] = []
            for (let mmr of stats.mmrHistory) {
                newHist.push(mmr += mmrDiff);
            }
            stats.mmr = interaction.options.getNumber('mmr', true);
            stats.mmrHistory = newHist;
            await updateStats(stats);
            await interaction.reply({ephemeral: true, content: "user's mmr has been updated"});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'set_mmr',
    allowedRoles: tokens.Mods,
}