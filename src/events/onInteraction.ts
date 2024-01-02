import {Interaction} from "discord.js";
import {logError} from "../loggers";
import {Data} from "../data";
import {CommandList} from "../commands/_CommandList";
import {commandPermission, getChannels} from "../utility/commandPermission";
import {ButtonList} from "../buttons/_ButtonList";
import {SelectMenuList} from "../selectMenus/_SelectMenuList";
import {ModalList} from "../modals/_ModalList";

export const onInteraction = async (interaction: Interaction, data: Data) => {
    try {
        if (interaction.isChatInputCommand()) {
            const command = CommandList.get(interaction.commandName)!;
            const permission = await commandPermission(interaction, command);
            if (permission.limited) {
                await interaction.reply({ephemeral: true, content: "Please wait before doing this again"});
            } else if (permission.channel) {
                await interaction.reply({ephemeral: true, content: `Please use this in a valid channel\nValid channels: ${getChannels(command.allowedChannels!)}`});
            } else if (permission.valid) {
                await command.run(interaction, data);
            } else {
                await interaction.reply({ephemeral: true, content: "You do not have permission to use this command"});
            }
        } else if (interaction.isButton()) {
            const button = ButtonList.get(interaction.customId)!;
            const permission = await commandPermission(interaction, button);
            if (permission.limited) {
                await interaction.reply({ephemeral: true, content: "Please wait before doing this again"});
            } else if (permission.channel) {
                await interaction.reply({ephemeral: true, content: `Please use this in a valid channel\nValid channels: ${getChannels(button.allowedChannels!)}`});
            } else if (permission.valid) {
                await button.run(interaction, data);
            } else {
                await interaction.reply({ephemeral: true, content: "You do not have permission to use this command"});
            }
        } else if (interaction.isStringSelectMenu()) {
            const selectMenu = SelectMenuList.get(interaction.customId)!;
            const permission = await commandPermission(interaction, selectMenu);
            if (permission.limited) {
                await interaction.reply({ephemeral: true, content: "Please wait before doing this again"});
            } else if (permission.channel) {
                await interaction.reply({ephemeral: true, content: `Please use this in a valid channel\nValid channels: ${getChannels(selectMenu.allowedChannels!)}`});
            } else if (permission.valid) {
                await selectMenu.run(interaction, data);
            } else {
                await interaction.reply({ephemeral: true, content: "You do not have permission to use this command"});
            }
        } else if (interaction.isModalSubmit()) {
            const modal = ModalList.get(interaction.customId)!;
            const permission = await commandPermission(interaction, modal);
            if (permission.limited) {
                await interaction.reply({ephemeral: true, content: "Please wait before doing this again"});
            } else if (permission.channel) {
                await interaction.reply({ephemeral: true, content: `Please use this modal in a valid channel\nValid channels: ${getChannels(modal.allowedChannels!)}`});
            } else if (permission.guild) {
                await interaction.reply({ephemeral: true, content: "This modal cannot be used in this server"});
            } else if (permission.valid) {
                await modal.run(interaction, data);
            } else {
                await interaction.reply({ephemeral: true, content: "You do not have permission to use this modal"});
            }
        }
    } catch (e) {
        await logError(e, interaction);
    }
}