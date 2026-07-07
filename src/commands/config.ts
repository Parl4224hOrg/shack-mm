import {Command} from "../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {MessageFlagsBitField, SlashCommandBooleanOption} from "discord.js";
import {logError} from "../loggers";
import {getUserByUser} from "../modules/getters/getUser";
import {updateUser} from "../modules/updaters/updateUser";

export const config: Command = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription("Updates your matchmaking preferences")
        .addBooleanOption(new SlashCommandBooleanOption()
            .setName("move_after_game")
            .setDescription("Whether the bot should move you after a game ends")
            .setRequired(false)),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user, data);
            const moveAfterGame = interaction.options.getBoolean('move_after_game');

            if (moveAfterGame == null) {
                await interaction.reply({
                    flags: MessageFlagsBitField.Flags.Ephemeral,
                    content: "You have updated no preferences",
                });
                return;
            }

            dbUser.moveAfterGame = moveAfterGame;
            await updateUser(dbUser, data);

            await interaction.reply({
                flags: MessageFlagsBitField.Flags.Ephemeral,
                content: moveAfterGame
                    ? "You have updated your preference to be moved after games"
                    : "You have updated your preference to not be moved after games",
            });
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'config',
}
