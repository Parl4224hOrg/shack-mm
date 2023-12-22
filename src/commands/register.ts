import {Command} from "../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {SlashCommandStringOption} from "discord.js";
import {logError} from "../loggers";
import {getUserByUser} from "../modules/getters/getUser";
import {updateUser} from "../modules/updaters/updateUser";
import tokens from "../tokens";

export const register: Command = {
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription("Register an oculus name to display")
        .addStringOption(new SlashCommandStringOption()
            .setName('name')
            .setDescription("Name to register")
            .setRequired(true)),
    run: async (interaction) => {
        try {
            const dbUser = await getUserByUser(interaction.user);
            dbUser.oculusName = interaction.options.getString('name', true).replace("<@", "").replace(">", "");
            await updateUser(dbUser);
            const member = await interaction.guild!.members.fetch(interaction.user);
            await member.roles.add(tokens.Player);
            await interaction.reply({ephemeral: true, content: `You have registered please go to <#${tokens.RegionSelect}> to select your region`});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'register',
}