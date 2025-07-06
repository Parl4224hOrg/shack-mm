import {ButtonBuilder} from "@discordjs/builders";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {Button} from "../../interfaces/Button";
import {ButtonStyle, MessageFlagsBitField} from "discord.js";

export const switchMap: Button = {
    data: new ButtonBuilder()
        .setLabel('Switch Map')
        .setStyle(ButtonStyle.Danger)
        .setCustomId('switch-map'),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user, data);
            const game = data.findGame(dbUser._id);
            if (game) {
                await interaction.deferReply();
                await game.switchMap();
                await interaction.followUp({content: `Map switched by <@${interaction.user.id}>`});
            } else {
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "Could not find game"});
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'switch-map',
}