import {Button} from "../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle} from "discord.js";
import {logError} from "../loggers";
import {register} from "../modals/register";

export const signup: Button = {
    data: new ButtonBuilder()
        .setLabel('Sign Up')
        .setCustomId('sign-up')
        .setStyle(ButtonStyle.Success),
    run: async (interaction) => {
        try {
            await interaction.showModal(register.data);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'sign-up',
}