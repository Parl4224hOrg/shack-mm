import {Button} from "../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle} from "discord.js";
import {logError} from "../loggers";
import {registerSteamModal} from "../modals/registerSteam";

export const registerSteam: Button = {
    data: new ButtonBuilder()
        .setLabel("Register Steam ID")
        .setCustomId("register-steam")
        .setStyle(ButtonStyle.Primary),
    run: async (interaction) => {
        try {
            await interaction.showModal(registerSteamModal.data);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: "register-steam",
};

export const steamIdHelpLink = new ButtonBuilder()
    .setLabel("Find SteamID64")
    .setStyle(ButtonStyle.Link)
    .setURL("https://steamid.io/");
