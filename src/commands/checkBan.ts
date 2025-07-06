import {Command} from "../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {logError} from "../loggers";
import {getUserByUser} from "../modules/getters/getUser";
import {getCheckBanMessage} from "../utility/punishment";
import {MessageFlagsBitField} from "discord.js";

export const checkBan: Command = {
    data: new SlashCommandBuilder()
        .setName('check_ban')
        .setDescription("Checks your current ban counter, cd, and ability to queue"),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user, data);
            await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: await getCheckBanMessage(dbUser, data)});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "check_ban"
}