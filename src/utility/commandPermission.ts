import {Interaction} from "discord.js";
import {Command} from "../interfaces/Command";
import {Button} from "../interfaces/Button";
import {StringSelectMenu} from "../interfaces/SelectMenu";
import {grammaticalList} from "./grammatical";

export const commandPermission = async (interaction: Interaction, command: Command | Button | StringSelectMenu) => {
    let valid = false;
    let limited = false;
    let channel = false;
    if (command.limiter) {
        if (command.limiter.take(interaction.user.id)) {
            limited = true;
        }
    }
    if (command.allowedChannels) {
        if (!command.allowedChannels.includes(interaction.channelId!)) {
            channel = true;
        }
    }
    if (command.allowedUsers && !limited && !channel) {
        if (command.allowedUsers.includes(interaction.user.id)) {
            valid = true;
        }
    } else if (command.allowedRoles && !limited && !channel) {
        const member = await interaction.guild!.members.fetch(interaction.user.id);
        for (let role of command.allowedRoles) {
            if (member!.roles.cache.has(role)) {
                valid = true;
                break;
            }
        }
    } else {
        valid = true;
    }
    return {valid: valid, limited: limited, channel: channel};
}

export const getChannels = (channels: string[]) => {
    let channelsTagged: string[] = []
    for (let channel of channels) {
        channelsTagged.push(`<#${channel}>`);
    }
    return grammaticalList(channelsTagged);
}
