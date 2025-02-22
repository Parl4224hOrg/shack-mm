import {Button} from "../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle} from "discord.js";
import {logError} from "../loggers";
import {reRegister} from "../modals/reRegister";

export const register: Button = {
    data: new ButtonBuilder()
        .setLabel('Register')
        .setCustomId('register')
        .setStyle(ButtonStyle.Primary),
    run: async (interaction) => {
        try {
            await interaction.showModal(reRegister.data);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'register',
}