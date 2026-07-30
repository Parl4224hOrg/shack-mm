import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {userOptional} from "../../utility/options";
import tokens from "../../tokens";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {getStats} from "../../modules/getters/getStats";
import {statsEmbed} from "../../embeds/statsEmbed";
import {MessageFlagsBitField, SlashCommandBooleanOption} from "discord.js";
import {generateStatsImage} from "../../utility/stats";

export const stats: Command = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Displays a users stats')
        .addUserOption(userOptional('User to display stats of'))
        .addBooleanOption(new SlashCommandBooleanOption()
            .setName("use-old-stats")
            .setDescription("Use old stats embed instead of new stats")
            .setRequired(false)
        ),
    run: async (interaction, data) => {
        try {
            let user = interaction.options.getUser('user');
            if (!user) {
                user = interaction.user;
            }
            const useOldStats = interaction.options.getBoolean('use-old-stats') ?? false;
            const dbUser = await getUserByUser(user, data);
            // const queueId = interaction.options.getString('queue', true)
            const queueId = "SND";
            // @ts-ignore
            if (queueId != "ALL") {
                const userStats = await getStats(dbUser._id, queueId);
                if (useOldStats) {

                    const embed = statsEmbed(userStats, dbUser, user.username, user.avatarURL()!)
                    await interaction.reply({embeds: [embed]});
                } else {
                    if (userStats.gamesPlayedSinceReset < 10) {
                        const embed = statsEmbed(userStats, dbUser, user.username, user.avatarURL()!)
                        await interaction.reply({embeds: [embed]});
                    } else {
                        const image = await generateStatsImage(userStats, user.displayName);
                        await interaction.reply({files: [image]});
                    }
                }
            } else {
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: 'getting stats for all is not currently supported'});
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'stats',
    allowedChannels: [tokens.SNDChannel, tokens.ActionsChannel],
}
