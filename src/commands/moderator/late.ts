import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {userOption} from "../../utility/options";
import tokens from "../../tokens";
import {logError} from "../../loggers";
import {autoLate} from "../../utility/punishment";
import {getUserByUser} from "../../modules/getters/getUser";

export const late: Command = {
    data: new SlashCommandBuilder()
        .setName("late")
        .setDescription("Late to the server")
        .addUserOption(userOption("User to late")),
    run: async (interaction, data) => {
        try {
            let dbUser = await getUserByUser(interaction.options.getUser('user', true), data);
            dbUser = await autoLate(dbUser._id, data);
            let times = "";
            for (let time of dbUser.lateTimes) {
                times += `<t:${time}:F>\n`;
            }
            await interaction.reply({content: `<@${dbUser.id}> Has been given a late\nTotal Count ${dbUser.lates}\nTimes:\n${times}`});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "late",
    allowedRoles: tokens.Mods,
}