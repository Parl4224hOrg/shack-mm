import {Command} from "../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {logError} from "../loggers";
import {getUserByUser} from "../modules/getters/getUser";
import moment from "moment/moment";
import {updateUser} from "../modules/updaters/updateUser";

export const checkBan: Command = {
    data: new SlashCommandBuilder()
        .setName('check_ban')
        .setDescription("Checks your current ban counter, cd, and ability to queue"),
    run: async (interaction) => {
        try {
            const dbUser = await getUserByUser(interaction.user);
            let cd;
            if (moment().unix() > dbUser.banUntil) {
                cd = `<@${dbUser.id}>\nNo current cooldown, Last cooldown was <t:${dbUser.lastBan}:R>\nBan Counter: ${dbUser.banCounter}`;
            } else {
                cd = `<@${dbUser.id}>\nCooldown ends <t:${dbUser.banUntil}:R>\nBan Counter: ${dbUser.banCounter}`;
            }
            cd += `\nConsecutive games: ${dbUser.gamesPlayedSinceReduction}, Next reduction by time: <t:${dbUser.lastBan + 1209600}:F>`
            if (dbUser.frozen == null) {
                dbUser.frozen = false;
                await updateUser(dbUser);
            }
            if (dbUser.frozen) {
                cd += "\nYou are frozen from queueing due to a pending ticket";
            }
            await interaction.reply({ephemeral: true, content: cd})
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "check_ban"
}