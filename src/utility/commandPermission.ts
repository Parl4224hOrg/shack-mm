import {Interaction} from "discord.js";
import {Command, SubCommand} from "../interfaces/Command";
import {Button} from "../interfaces/Button";
import {StringSelectMenu} from "../interfaces/SelectMenu";
import {grammaticalList} from "./grammatical";
import {CommandPermission} from "../interfaces/Internal";
import {Modal} from "../interfaces/Modal";

export const commandPermission = async (interaction: Interaction, command: Command | SubCommand | Button | StringSelectMenu | Modal): Promise<CommandPermission> => {
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
    }
    if (command.allowedRoles && !limited && !channel) {
        const member = await interaction.guild!.members.fetch(interaction.user.id);
        for (let role of command.allowedRoles) {
            if (member.roles.cache.has(role)) {
                valid = true;
                break;
            }
        }
    } else {
        valid = true;
    }
    return {valid: valid, limited: limited, channel: channel, guild: false};
}

export const getChannels = (channels: string[]) => {
    let channelsTagged: string[] = []
    for (let channel of channels) {
        channelsTagged.push(`<#${channel}>`);
    }
    return grammaticalList(channelsTagged);
}
