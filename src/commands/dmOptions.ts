import {Command} from "../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {SlashCommandBooleanOption} from "discord.js";
import {logError} from "../loggers";
import {getUserByUser} from "../modules/getters/getUser";

export const dmOptions: Command = {
    data: new SlashCommandBuilder()
        .setName('dm_options')
        .setDescription("Use any of the optional arguments to set dm options")
        .addBooleanOption(new SlashCommandBooleanOption()
            .setName("queue")
            .setDescription("Sets your preference for DMs about queue time expiring")
            .setRequired(false))
        .addBooleanOption(new SlashCommandBooleanOption()
            .setName("match")
            .setDescription("Sets your preference for DMs about matches being generated and abandons")
            .setRequired(false))
        .addBooleanOption(new SlashCommandBooleanOption()
            .setName("auto")
            .setDescription("Sets your preference for DMs about being auto re readied")
            .setRequired(false)),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user, data);
            const queue = interaction.options.getBoolean('queue');
            const match = interaction.options.getBoolean('match');
            const auto = interaction.options.getBoolean('auto');
            let response = "";
            if (queue) {
                dbUser.dmQueue = queue;
                response += `You have set DM preference for Queue to: ${dbUser.dmQueue}\n`;
            }
            if (match) {
                dbUser.dmMatch = match;
                response += `You have set DM preference for Match to: ${dbUser.dmMatch}\n`;
            }
            if (auto) {
                dbUser.dmAuto = auto;
                response += `You have set DM preference for Auto to: ${dbUser.dmAuto}\n`;
            }

            if (response == "") {
                await interaction.reply({ephemeral: true, content: "You have updated no preferences"});
            } else {
                await interaction.reply({ephemeral: true, content: response});
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'dm_options'
}