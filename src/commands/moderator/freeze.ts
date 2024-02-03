import {Command, SubCommand} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {userOption} from "../../utility/options";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {updateUser} from "../../modules/updaters/updateUser";
import tokens from "../../tokens";
import {SlashCommandSubcommandBuilder} from "discord.js";

export const freeze: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('freeze')
        .setDescription("Freezes a user")
        .addUserOption(userOption("User to freeze")),
    run: async (interaction, data) => {
        try {
            if (interaction.channel!.isThread()) {
                await interaction.reply({ephemeral: true, content: "This command cannot be used in a thread please use it in the ticket itself"})
            } else {
                const dbUser = await getUserByUser(interaction.options.getUser('user', true), data);
                const guild = await interaction.client.guilds.fetch(tokens.GuildID);
                const member = await guild.members.fetch(dbUser.id);
                dbUser.frozen = !dbUser.frozen;
                await updateUser(dbUser, data);
                if (dbUser.frozen) {
                    await member.roles.add(tokens.MutedRole);
                    data.removeFromQueue(dbUser._id, "ALL");
                    await interaction.reply({ephemeral: false, content: `<@${dbUser.id}> has been frozen`});
                } else {
                    await member.roles.remove(tokens.MutedRole);
                    await interaction.reply({ephemeral: false, content: `<@${dbUser.id}> has been unfrozen`});
                }
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'freeze',
    allowedRoles: tokens.Mods,
}