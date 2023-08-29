import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {userOption} from "../../utility/options";
import tokens from "../../tokens";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";

export const forceAbandon: Command = {
    data: new SlashCommandBuilder()
        .setName('force_abandon')
        .setDescription('Abandons a user from the match')
        .addUserOption(userOption('User to abandon')),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.options.getUser('user', true));
            const game = data.findGame(dbUser._id);
            if (game) {
                await game.abandon({dbId: dbUser._id, discordId: dbUser.id, team: -1, accepted: false});
                await interaction.reply({ephemeral: false, content: `<@${dbUser.id}> has been abandoned`});
            } else {
                await interaction.reply({ephemeral: true, content: 'User not in a game'});
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'force_abandon',
    allowedRoles: [tokens.ModRole],
}