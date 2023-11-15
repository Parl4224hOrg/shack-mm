import {ChatInputCommandInteraction} from "discord.js";
import {SubCommand} from "../interfaces/Command";
import {Data} from "../data";
import {CommandPermission} from "../interfaces/Internal";
import {getChannels} from "../utility/commandPermission";


export const onSubCommand = async (interaction: ChatInputCommandInteraction, subCommand: SubCommand, data: Data, permission: CommandPermission) => {
    // Checks to see if user is rate limited
    if (permission.limited) {
        // Responds if user is rate limited
        await interaction.reply({ephemeral: true, content: "Please wait before doing this again"});
        // Checks to see if user is using command in correct channel
    } else if (permission.channel) {
        // Responds with the available channels to use the command in
        await interaction.reply({ephemeral: true, content: `Please use this in a valid channel\nValid channels: ${getChannels(subCommand.allowedChannels!)}`});
        // Check to see if user is using command in proper server (should always be correct just in case command syncing is done wrong)
    } else if (permission.guild) {
        // Responds if user is using command in an incorrect server
        await interaction.reply({ephemeral: true, content: "This command cannot be used in this server"});
        // Checks if Permission is valid
    } else if (permission.valid) {
        // Runs command in permissions are valid
        await subCommand.run(interaction, data);
        // If permission is invalid
    } else {
        // Responds if user does not have permission to use the command
        await interaction.reply({ephemeral: true, content: "You do not have permission to use this command"});
    }
}