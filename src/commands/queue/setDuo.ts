import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {MessageFlagsBitField} from "discord.js";
import {userOption} from "../../utility/options";
import {updateUser} from "../../modules/updaters/updateUser";

export const setDuo: Command = {
    data: new SlashCommandBuilder()
        .setName("set-duo")
        .setDescription("Sets your duo queue partner")
        .addUserOption(userOption("Who to set as your duo")),
    run: async (interaction, data) => {
        try {
            const queue = data.getQueue();
            const dbUser = await getUserByUser(interaction.user, data);
            const partner = await getUserByUser(interaction.options.getUser('user', true), data);
            if (dbUser._id.equals(partner._id)) {
                await interaction.reply({
                    content: "You cannot set yourself as your duo",
                    flags: MessageFlagsBitField.Flags.Ephemeral,
                });
                return;
            }
            dbUser.duoId = partner._id;
            const found = queue.inQueue.find(u => u.dbId.equals(dbUser._id))
            if (found) {
                found.duoId = partner._id;
            }
            await updateUser(dbUser, data);
            await interaction.reply({
                content: "Set your duo",
                flags: MessageFlagsBitField.Flags.Ephemeral,
            });
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "set-duo",
}