import {Button} from "../../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle, MessageFlagsBitField} from "discord.js";
import {logError} from "../../../loggers";
import {confirmAbandonView} from "../../../views/acceptView";
import {getUserByUser} from "../../../modules/getters/getUser";
import {getCooldownSeconds} from "../../../utility/punishment";
import {grammaticalTime} from "../../../utility/grammatical";

export const abandonButton: Button = {
    data: new ButtonBuilder()
        .setLabel("Abandon")
        .setStyle(ButtonStyle.Danger)
        .setCustomId('abandon-init'),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user, data);
            const cooldownSeconds = getCooldownSeconds(dbUser.banCounterAbandon, 1);
            const cooldownTime = grammaticalTime(cooldownSeconds);
            await interaction.reply({
                flags: MessageFlagsBitField.Flags.Ephemeral,
                content: `Are you sure you want to abandon? You will get a ${cooldownTime} cooldown if you do.`,
                components: [confirmAbandonView()],
            })
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'abandon-init',
}
