import {Button} from "../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle, MessageFlagsBitField} from "discord.js";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {acceptLimiter} from "../../utility/limiters";
import {gameEmbed} from "../../embeds/matchEmbeds";
import {updateAcceptMessage} from "../../controllers/MatchAcceptEmbedController";



export const accept: Button = {
    data: new ButtonBuilder()
        .setLabel("Accept")
        .setStyle(ButtonStyle.Success)
        .setCustomId('match-accept'),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user, data);
            const controller = data.findController();
            if (controller) {
                const response = await controller.acceptGame(dbUser._id);
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: response.message});
                const game = controller.findGame(dbUser._id);
                if (game) {
                    await updateAcceptMessage(interaction.message, gameEmbed(game), game.getUsers().reduce((total, user) => {
                        if (user.accepted) {
                            return total + 1;
                        }
                        return total;
                    }, 0));
                }
            } else {
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "Could not find controller please contact a mod"})
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'match-accept',
    limiter: acceptLimiter,
}