import {OverwriteResolvable, PermissionsBitField, Role} from "discord.js";
import tokens from "../tokens";


export const hidePerms: OverwriteResolvable = {
    id: tokens.GuildID,
    deny: [
        PermissionsBitField.Flags.ViewChannel,
    ],
    type: 0,
}

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

export const getVCPerms = (role: Role | string): OverwriteResolvable[] => {
    const perms: OverwriteResolvable[] = [];
    perms.push({
        id: (role instanceof Role) ? role.id : role,
        allow: [
            PermissionsBitField.Flags.ReadMessageHistory,
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.UseApplicationCommands,
            PermissionsBitField.Flags.Connect,
            PermissionsBitField.Flags.UseVAD,
            PermissionsBitField.Flags.Stream,
            PermissionsBitField.Flags.Speak,
        ],
        type: 0,
    });
    perms.push(vcModPerms, vcDenyEverybody, mutedPerms);

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

const vcModPerms: OverwriteResolvable = {
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
        PermissionsBitField.Flags.MuteMembers,
        PermissionsBitField.Flags.DeafenMembers,
        PermissionsBitField.Flags.MoveMembers,
        PermissionsBitField.Flags.Connect,
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

const vcDenyEverybody: OverwriteResolvable = {
    id: tokens.GuildID,
    allow: [
        PermissionsBitField.Flags.ViewChannel,
    ],
    deny:
        [
            PermissionsBitField.Flags.AttachFiles,
            PermissionsBitField.Flags.EmbedLinks,
            PermissionsBitField.Flags.Connect,
            PermissionsBitField.Flags.Speak,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.UseSoundboard,
            PermissionsBitField.Flags.UseExternalSounds
        ],
    type: 0,
}

const mutedPerms: OverwriteResolvable = {
    id: tokens.MutedRole,
    deny: [PermissionsBitField.Flags.SendMessages],
    type: 0,
}
