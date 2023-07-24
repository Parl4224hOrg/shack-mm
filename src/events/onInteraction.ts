import {Interaction} from "discord.js";
import {logError} from "../loggers";
import {Data} from "../data";
import {CommandList} from "../commands/_CommandList";
import {commandPermission} from "../utility/commandPermission";
import {ButtonList} from "../buttons/_ButtonList";

export const onInteraction = async (interaction: Interaction, data: Data) => {
    try {
        if (interaction.isChatInputCommand()) {
            const command = CommandList.get(interaction.commandName)!;
            const permission = await commandPermission(interaction, command);
            if (permission.limited) {
                await interaction.reply({ephemeral: true, content: "Please wait before doing this again"});
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
            } else if (permission.valid) {
                await button.run(interaction, data);
            } else {
                await interaction.reply({ephemeral: true, content: "You do not have permission to use this command"});
            }
        }
    } catch (e) {
        await logError(e, interaction);
    }
}