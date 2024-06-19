import {SubCommand} from "../../interfaces/Command";
import {mmrOption, userOption} from "../../utility/options";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {getStats} from "../../modules/getters/getStats";
import {updateStats} from "../../modules/updaters/updateStats";
import tokens from "../../tokens";
import {SlashCommandSubcommandBuilder} from "discord.js";
import {Client, EmbedBuilder, TextChannel} from "discord.js";

export const adjustMMR: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('adjust_mmr')
        .setDescription("Adjusts a user's mmr by a specified amount")
        .addUserOption(userOption("User to adjust mmr of"))
        .addNumberOption(option => option.setName('mmr_delta').setDescription('Amount to change MMR by').setRequired(true)),
    run: async (interaction, data) => {
        try {
            const logChannel = await interaction.client.channels.fetch(tokens.LogChannel) as TextChannel;
            
            await interaction.deferReply({ ephemeral: true });
            let reason = interaction.options.getString('reason', true);
            const dbUser = await getUserByUser(interaction.options.getUser('user', true), data);
            const stats = await getStats(dbUser._id, "SND");
            const mmrDelta = interaction.options.getNumber('mmr_delta', true);

            const logEmbed = new EmbedBuilder();
            logEmbed.setTitle(`Adjust MMR logging`);
            logEmbed.setDescription(`line 29`);
            await channel.send({embeds: [logEmbed.toJSON()]});
            
            for (let mmr of stats.mmrHistory) {
                mmr += mmrDelta;
            }
            
            logEmbed = new EmbedBuilder();
            logEmbed.setTitle(`Adjust MMR logging`);
            logEmbed.setDescription(`line 38`);
            await channel.send({embeds: [logEmbed.toJSON()]});
            
            stats.mmr += mmrDelta;
            await updateStats(stats);

            logEmbed = new EmbedBuilder();
            logEmbed.setTitle(`Adjust MMR logging`);
            logEmbed.setDescription(`line 46`);
            await channel.send({embeds: [logEmbed.toJSON()]});
            
            await interaction.followUp({content: `<@${dbUser.id}>'s MMR has been adjusted by ${mmrDelta}. New MMR is ${stats.mmr}.` });
            const channel = await interaction.client.channels.fetch(tokens.ModeratorLogChannel) as TextChannel;
            const embed = new EmbedBuilder();
            embed.setTitle(`User ${dbUser.id} has been MMR adjusted`);
            embed.setDescription(`<@${dbUser.id}> MMR has been adjusted by ${mmrDelta}. New MMR is ${stats.mmr}. Done by <@${interaction.user.id}>`);
            await channel.send({embeds: [embed.toJSON()]});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'adjust_mmr',
    allowedRoles: tokens.Mods,
}
