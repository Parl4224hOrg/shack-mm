import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {userOption} from "../../utility/options";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {updateUser} from "../../modules/updaters/updateUser";
import tokens from "../../tokens";

export const freeze: Command = {
    data: new SlashCommandBuilder()
        .setName('freeze')
        .setDescription("Freezes a user")
        .addUserOption(userOption("User to freeze")),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.options.getUser('user', true));
            const guild = await interaction.client.guilds.fetch(tokens.GuildID);
            const member = await guild.members.fetch(dbUser.id);
            dbUser.frozen = !dbUser.frozen;
            await updateUser(dbUser);
            if (dbUser.frozen) {
                await member.roles.add(tokens.MutedRole);
                data.removeFromQueue(dbUser._id, "ALL");
                await interaction.reply({ephemeral: false, content: `<@${dbUser.id}> has been frozen`});
            } else {
                await member.roles.remove(tokens.MutedRole);
                await interaction.reply({ephemeral: false, content: `<@${dbUser.id}> has been unfrozen`});
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'freeze',
    allowedRoles: [tokens.ModRole],
}