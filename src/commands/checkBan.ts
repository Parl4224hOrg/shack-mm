import {Command} from "../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {logError} from "../loggers";
import {getUserByUser} from "../modules/getters/getUser";
import {getCheckBanMessage} from "../utility/punishment";

export const checkBan: Command = {
    data: new SlashCommandBuilder()
        .setName('check_ban')
        .setDescription("Checks your current ban counter, cd, and ability to queue"),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user, data);
            await interaction.reply({ephemeral: true, content: await getCheckBanMessage(dbUser, data)});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "check_ban"
}