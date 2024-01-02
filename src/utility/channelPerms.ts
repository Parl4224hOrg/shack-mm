import {OverwriteResolvable, PermissionsBitField, Role} from "discord.js";
import tokens from "../tokens";


export const getAcceptPerms = (acceptRole: Role | string): OverwriteResolvable[] => {
    const perms: OverwriteResolvable[] = [];
    perms.push({
        id: (acceptRole instanceof Role) ? acceptRole.id : acceptRole,
        allow: [
            PermissionsBitField.Flags.ReadMessageHistory,
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.UseApplicationCommands,
        ],
        type: 0,
    });

    perms.push(modPerms, denyEverybody);

    return perms;
}

export const getMatchPerms = (role: Role | string): OverwriteResolvable[] => {
    const perms: OverwriteResolvable[] = [];
    perms.push({
        id: (role instanceof Role) ? role.id : role,
        allow: [
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory,
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.UseApplicationCommands,
        ],
        type: 0,
    });

    perms.push(modPerms, denyEverybody);

    return perms;
}

const modPerms: OverwriteResolvable = {
        id: tokens.ModRole,
        allow: [
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory,
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.UseApplicationCommands,
            PermissionsBitField.Flags.ManageMessages,
            PermissionsBitField.Flags.MentionEveryone,
        ],
        type: 0,
}

const denyEverybody: OverwriteResolvable = {
        id: tokens.GuildID,
        deny:
            [
                PermissionsBitField.Flags.ViewChannel,
            ],
        type: 0,
}
