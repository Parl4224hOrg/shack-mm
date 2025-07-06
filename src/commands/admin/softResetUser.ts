import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import tokens from "../../tokens";
import {logError} from "../../loggers";
import StatsModel from "../../database/models/StatsModel";
import {userOption} from "../../utility/options";
import {getUserByUser} from "../../modules/getters/getUser";
import {MessageFlagsBitField} from "discord.js";

export const softResetUser: Command = {
    data: new SlashCommandBuilder()
        .setName("soft_reset_user")
        .setDescription("Will soft reset a user")
        .addUserOption(userOption("User to soft reset")),
    run: async (interaction, data) => {
        try {
            await interaction.deferReply({flags: MessageFlagsBitField.Flags.Ephemeral});
            const user = interaction.options.getUser('user', true);
            const dbUser = await getUserByUser(user, data);
            await StatsModel.findOneAndUpdate({userId: dbUser._id}, {gamesPlayedSinceReset: 0});
            const member = await interaction.guild!.members.fetch(user.id);
            for (let role of member.roles.cache.keys()) {
                if (tokens.RankRoles.includes(role)) {
                    await member.roles.remove(role, "remove rank role single user MMR reset");
                }
            }
            await interaction.followUp({flags: MessageFlagsBitField.Flags.Ephemeral, content: `Soft reset <@${user.id}>`});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "soft_reset_user",
    allowedRoles: [tokens.AdminRole, tokens.LeadModRole],
}