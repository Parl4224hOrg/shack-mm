import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {updateUser} from "../../modules/updaters/updateUser";

export const setRequeue: Command = {
    data: new SlashCommandBuilder()
        .setName('set_requeue')
        .setDescription("Changes whether you should be auto requeued or not"),
    run: async (interaction) => {
        try {
            const dbUser = await getUserByUser(interaction.user);
            dbUser.requeue = !dbUser.requeue;
            await updateUser(dbUser);
            if (dbUser.requeue) {
                await interaction.reply({ephemeral: true, content: "You have updated your preference to be requeued"});
            } else {
                await interaction.reply({ephemeral: true, content: "You have updated your preference to not be requeued"});
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'set_requeue',
}