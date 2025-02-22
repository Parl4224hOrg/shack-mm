import {Button} from "../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle} from "discord.js";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {getCheckBanMessage} from "../../utility/punishment";

export const checkBanButton: Button = {
    data: new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setLabel("Check Ban")
        .setCustomId('check-ban-button'),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user, data);
            await interaction.reply({ephemeral: true, content: await getCheckBanMessage(dbUser, data)});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'check-ban-button',
}
