import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import tokens from "../../tokens";
import {logError} from "../../loggers";
import StatsModel from "../../database/models/StatsModel";
import {TextChannel} from "discord.js";

export const softResetUser: Command = {
    data: new SlashCommandBuilder()
        .setName("soft_reset_user")
        .setDescription("Will soft reset a user"),
    run: async (interaction) => {
        try {
            await interaction.deferReply({ephemeral: true});
            const user = interaction.options.getUser('user', true);
            await StatsModel.findOneAndUpdate({id: user.id}, {gamesPlayedSinceReset: 0});
            const member = await interaction.guild!.members.fetch(user.id);
            for (let role of member.roles.cache.keys()) {
                if (tokens.RankRoles.includes(role)) {
                    await member.roles.remove(role);
                }
            }
            await interaction.reply({ephemeral: true, content: `Soft reset <@${user.id}>`});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "soft_reset_user",
    allowedRoles: [tokens.AdminRole, tokens.LeadModRole],
}