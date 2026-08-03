import {Button} from "../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle, MessageFlagsBitField} from "discord.js";
import {RateLimiter} from "discord.js-rate-limiter";
import {logError} from "../loggers";
import {reclaimRankRole} from "../utility/reclaimRole";

export const reclaimRole: Button = {
    data: new ButtonBuilder().setLabel("Reclaim Role").setStyle(ButtonStyle.Primary).setCustomId("reclaim-role"),
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
    id: "reclaim-role",
    limiter: new RateLimiter(2, 20000),
};
