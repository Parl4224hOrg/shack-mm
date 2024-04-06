import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CategoryChannel, SlashCommandChannelOption} from "discord.js";
import {logError} from "../../loggers";
import tokens from "../../tokens";

export const categoryDelete: Command = {
    data: new SlashCommandBuilder()
        .setName('category_delete')
        .setDescription("Deletes all channels in a category")
        .addChannelOption(new SlashCommandChannelOption()
            .setName("category")
            .setDescription("Category to delete all channels in")
            .setRequired(true)),
    run: async (interaction) => {
        try {
            await interaction.deferReply({ephemeral: true});
            const category = interaction.options.getChannel('category', true) as CategoryChannel;
            for (let channel of category.children.cache) {
                await channel[1].delete();
            }
            await interaction.followUp({ephemeral: true, content: "channels deleted"});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'category_delete',
    allowedUsers: [tokens.Parl],
    allowedRoles: tokens.Mods,
}