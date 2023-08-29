import {ActionRowBuilder, MessageActionRowComponentBuilder, StringSelectMenuOptionBuilder} from "discord.js";
import {modSelectMenu} from "../selectMenus/modSelectMenu";

export const modSelectView = (mods: StringSelectMenuOptionBuilder[]) => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(modSelectMenu.data.addOptions(mods)).toJSON();
}