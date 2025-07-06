import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {updateUser} from "../../modules/updaters/updateUser";
import {MessageFlagsBitField} from "discord.js";

export const setRequeue: Command = {
    data: new SlashCommandBuilder()
        .setName('set_requeue')
        .setDescription("Changes whether you should be auto requeued or not"),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user, data);
            dbUser.requeue = !dbUser.requeue;
            await updateUser(dbUser, data);
            if (dbUser.requeue) {
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "You have updated your preference to be requeued"});
            } else {
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "You have updated your preference to not be requeued"});
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'set_requeue',
}