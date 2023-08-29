import {StringSelectMenu} from "../interfaces/SelectMenu";
import {StringSelectMenuBuilder} from "discord.js";

export const modSelectMenu: StringSelectMenu = {
    data: new StringSelectMenuBuilder()
        .setCustomId('mod-picker')
        .setPlaceholder("Pick a mod")
        .setMinValues(1)
        .setMaxValues(1),
    run: async (interaction) => {
        await interaction.reply({ephemeral: true, content: 'coming soon'})
    },
    id: 'mod-picker',
}