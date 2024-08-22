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

    perms.push(modPerms, denyEverybody, mutedPerms);

    return perms;
}

export const getMatchPerms = (role: Role | string): OverwriteResolvable[] => {
    const perms: OverwriteResolvable[] = [];
    perms.push({
        id: (role instanceof Role) ? role.id : role,
        allow: [
            PermissionsBitField.Flags.ReadMessageHistory,
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.UseApplicationCommands,
        ],
        type: 0,
    });

    perms.push(modPerms, denyEverybody, mutedPerms);

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
            PermissionsBitField.Flags.AttachFiles,
            PermissionsBitField.Flags.EmbedLinks,
        ],
        type: 0,
}

const denyEverybody: OverwriteResolvable = {
        id: tokens.GuildID,
        deny:
            [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.AttachFiles,
                PermissionsBitField.Flags.EmbedLinks,
            ],
        type: 0,
}

const mutedPerms: OverwriteResolvable = {
    id: tokens.MutedRole,
    deny: [PermissionsBitField.Flags.SendMessages],
    type: 0,
}
