import {Interaction} from "discord.js";
import {Command} from "../interfaces/Command";
import {Button} from "../interfaces/Button";

export const commandPermission = async (interaction: Interaction, command: Command | Button) => {
    let valid = false;
    let limited = false;
    if (command.limiter) {
        if (command.limiter.take(interaction.user.id)) {
            limited = true;
        }
    }
    if (command.allowedUsers && !limited) {
        if (command.allowedUsers.includes(interaction.user.id)) {
            valid = true;
        }
    } else if (command.allowedRoles) {
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
    return {valid: valid, limited: limited};
}