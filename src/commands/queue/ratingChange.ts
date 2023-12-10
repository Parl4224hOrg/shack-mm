import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {userOptional} from "../../utility/options";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {getStats} from "../../modules/getters/getStats";

export const ratingChange: Command = {
    data: new SlashCommandBuilder()
        .setName('rating_change')
        .setDescription("View rating change for last game played")
        .addUserOption(userOptional("User to view rating change of")),
    run: async (interaction) => {
        try {
            let user = interaction.options.getUser('user');
            let self = true;
            if (!user) {
                self = false;
                user = interaction.user;
            }

            const dbUser = await getUserByUser(user);
            const stats = await getStats(dbUser._id, "SND");
            if (self) {
                await interaction.reply({content: `Your rating changed by ${stats.ratingChange} last game`});
            } else {
                await interaction.reply({content: `${user.username}'s rating changed by ${stats.ratingChange} last game`});
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'rating_change',
}