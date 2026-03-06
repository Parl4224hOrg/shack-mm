import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {MessageFlagsBitField} from "discord.js";
import {updateUser} from "../../modules/updaters/updateUser";

export const removeDuo: Command = {
    data: new SlashCommandBuilder()
        .setName("remove-duo")
        .setDescription("Removes your set duo queue partner"),
    run: async (interaction, data) => {
        try {
            const queue = data.getQueue();
            const dbUser = await getUserByUser(interaction.user, data);
            dbUser.duoId = undefined;
            const found = queue.inQueue.find(u => u.dbId.equals(dbUser._id))
            if (found) {
                found.duoId = undefined;
            }
            await updateUser(dbUser, data);
            await interaction.reply({
                content: "Removed your duo",
                flags: MessageFlagsBitField.Flags.Ephemeral,
            });
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "remove-duo",
}