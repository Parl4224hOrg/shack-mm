import {Command} from "../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {userOptional} from "../utility/options";
import tokens from "../tokens";
import {getUserByUser} from "../modules/getters/getUser";
import {getStats} from "../modules/getters/getStats";
import {MessageFlagsBitField} from "discord.js";
import {logError} from "../loggers";
import {generateStatsImage} from "../utility/stats";

export const NewStats: Command ={
    data: new SlashCommandBuilder()
        .setName("new-stats")
        .setDescription("Shows new stats image")
        .addUserOption(userOptional("User to get stats for")),
    run: async (interaction, data) => {
        try {
            let user = interaction.options.getUser('user');
            if (!user) {
                user = interaction.user;
            }
            const dbUser = await getUserByUser(user, data);
            // const queueId = interaction.options.getString('queue', true)
            const queueId = "SND";
            // @ts-ignore
            if (queueId != "ALL") {
                const stats = await getStats(dbUser._id, queueId);
                const image = await generateStatsImage(stats, user.displayName);
                await interaction.reply({files: [image]});
            } else {
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: 'getting stats for all is not currently supported'});
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "new-stats",
    allowedUsers: [tokens.Parl],
}