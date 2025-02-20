import {EmbedBuilder, GuildMember, PartialGuildMember} from "discord.js";
import tokens from "../tokens";

export const onMemberUpdate = async (oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) => {
    const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
    const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));

    const guild = newMember.guild;

    try {
        if (removedRoles.size > 0) {
            // Fetch audit logs to determine who removed the roles
            const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: 24 }); // 24 = MEMBER_ROLE_UPDATE
            const auditEntry = auditLogs.entries.first();
            const executor = auditEntry?.executor; // The user responsible for the action

            // Do not log if user is bot or does not exist
            if (!executor) return;
            if (executor.id == tokens.ClientID) return;

            const removedRolesList = removedRoles.map(role => role.name).join(", ");

            const embed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("Roles Removed")
                .setDescription(`Roles removed from ${newMember.user.tag}`)
                .addFields(
                    { name: "Removed Roles", value: removedRolesList || "None", inline: false },
                    { name: "Performed By", value: executor ? executor.tag : "Unknown", inline: false }
                )
                .setTimestamp();

            // Send the embed to a specific channel
            const logChannel = await guild.channels.fetch(tokens.ManualRoleLogChannel);
            if (logChannel && logChannel.isTextBased()) await logChannel.send({ embeds: [embed] });
        }

        if (addedRoles.size > 0) {
            // Fetch audit logs to determine who added the roles
            const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: 24 }); // 24 = MEMBER_ROLE_UPDATE
            const auditEntry = auditLogs.entries.first();
            const executor = auditEntry?.executor; // The user responsible for the action

            // Do not log if user is bot or does not exist
            if (!executor) return;
            if (executor.id == tokens.ClientID) return;

            const addedRolesList = addedRoles.map(role => role.name).join(", ");

            const embed = new EmbedBuilder()
                .setColor("Green")
                .setTitle("Roles Added")
                .setDescription(`Roles added to ${newMember.user.tag}`)
                .addFields(
                    { name: "Added Roles", value: addedRolesList || "None", inline: false },
                    { name: "Performed By", value: executor ? executor.tag : "Unknown", inline: false }
                )
                .setTimestamp();

            // Send the embed to a specific channel
            const logChannel = await guild.channels.fetch(tokens.ManualRoleLogChannel);
            if (logChannel && logChannel.isTextBased()) await logChannel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error("Error fetching audit logs or sending embed:", error);
    }

};