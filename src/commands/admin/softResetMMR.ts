import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import tokens from "../../tokens";
import {logError} from "../../loggers";
import StatsModel from "../../database/models/StatsModel";
import {TextChannel} from "discord.js";

export const softResetMMR: Command = {
    data: new SlashCommandBuilder()
        .setName("soft_reset_mmr")
        .setDescription("Will soft reset MMR"),
    run: async (interaction) => {
        try {
            await interaction.deferReply({ephemeral: true});
            await StatsModel.updateMany({}, {gamesPlayedSinceReset: 0});
            const users = await interaction.guild!.members.fetch();
            let count = 0;
            const channel = await interaction.client.channels.fetch(tokens.ModeratorLogChannel) as TextChannel;
            for (let user of users.values()) {
                for (let role of user.roles.cache) {
                    if (tokens.RankRoles.includes(role[0])) {
                        await user.roles.remove(role);
                    }
                }
                count++;
                if (count % 50) {
                    await channel.send(`Processed ${count}/${users.size} Users`);
                }
            }
            await channel.send(`Processed ${users.size}/${users.size} Users`);
            await interaction.reply({ephemeral: true, content: "Reset ranks and removed all rank roles"});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "soft_reset_mmr",
    allowedRoles: [tokens.AdminRole, tokens.LeadModRole],
}