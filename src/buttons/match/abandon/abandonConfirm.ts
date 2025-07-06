import {Button} from "../../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle, MessageFlagsBitField} from "discord.js";
import {logError} from "../../../loggers";
import {getUserByUser} from "../../../modules/getters/getUser";
import {Regions} from "../../../database/models/UserModel";

export const abandonConfirm: Button = {
    data: new ButtonBuilder()
        .setLabel("Confirm")
        .setStyle(ButtonStyle.Danger)
        .setCustomId('abandon-confirm'),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user, data);
            const controller = data.findController();
            if (controller) {
                const game = controller.getGame(dbUser._id);
                const abandon = await game!.abandon(
                    {
                        dbId: dbUser._id,
                        discordId: dbUser.id,
                        team: 0,
                        accepted: false,
                        region: Regions.APAC,
                        joined: false,
                        isLate: false,
                        hasBeenGivenLate: false,
                    }, false);
                if (abandon) {
                    await interaction.reply({content: "You have successfully abandoned"})
                } else {
                    await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "Something went wrong with abandoning"});
                }

            } else {
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "Could not find controller please contact a mod"})
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'abandon-confirm',
}