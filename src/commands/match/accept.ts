import {getUserByUser} from "../../modules/getters/getUser";
import {MessageFlagsBitField} from "discord.js";
import {updateAcceptMessage} from "../../controllers/MatchAcceptEmbedController";
import {gameEmbed} from "../../embeds/matchEmbeds";
import {logError} from "../../loggers";
import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";


export const accept: Command = {
    data: new SlashCommandBuilder()
        .setName('accept')
        .setDescription('Accepts the match'),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user, data);
            const controller = data.findController();
            if (controller) {
                const response = await controller.acceptGame(dbUser._id);
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: response.message});
                const game = controller.findGame(dbUser._id);
                if (game) {
                    const message = await interaction.channel!.messages.fetch(game.acceptMessageId);
                    if (message) {
                        await updateAcceptMessage(message, gameEmbed(game), game.getUsers().reduce((total, user) => {
                            if (user.accepted) {
                                return total + 1;
                            }
                            return total;
                        }, 0));
                    }
                }
            } else {
                await interaction.reply({
                    flags: MessageFlagsBitField.Flags.Ephemeral,
                    content: "Could not find controller please contact a mod"
                })
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'abandon',
}

