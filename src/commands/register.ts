import {Command} from "../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {MessageFlagsBitField, SlashCommandStringOption} from "discord.js";
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
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user, data);
            let registered = true;
            if (dbUser.oculusName == null) {
                registered = false;
            }
            dbUser.oculusName = interaction.options.getString('name', true).replace("<@", "").replace(">", "");
            await updateUser(dbUser, data);
            if (!registered) {
                const member = await interaction.guild!.members.fetch(interaction.user);
                await member.roles.add(tokens.Player);
                await interaction.reply({
                    flags: MessageFlagsBitField.Flags.Ephemeral,
                    content: `You have registered please go to <#${tokens.RegionSelect}> to select your region`
                });
            } else {
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "You have updated your registered name"})
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'register',
}