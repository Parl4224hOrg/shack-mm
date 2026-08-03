import {Command} from "../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {MessageFlagsBitField} from "discord.js";
import {logError} from "../loggers";
import {reclaimRankRole} from "../utility/reclaimRole";

export const reclaimRole: Command = {
    data: new SlashCommandBuilder()
        .setName("reclaim-role")
        .setDescription("Restore your earned SND rank role"),
    run: async (interaction, data) => {
        try {
            const member = await interaction.guild!.members.fetch(interaction.user.id);
            const result = await reclaimRankRole(member, data);
            await interaction.reply({
                flags: MessageFlagsBitField.Flags.Ephemeral,
                content: result.eligible
                    ? `Your ${result.rankName} rank role has been restored.`
                    : "You must complete at least 10 SND games before reclaiming a rank role.",
            });
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "reclaim-role",
};