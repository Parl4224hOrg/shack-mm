import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import tokens from "../../tokens";
import {logError} from "../../loggers";
import UserModel from "../../database/models/UserModel";
import {updateUser} from "../../modules/updaters/updateUser";
import {MessageFlagsBitField} from "discord.js";

export const fixCDs: Command = {
    data: new SlashCommandBuilder()
        .setName("fix_counters")
        .setDescription("Fix ban counters that don't exist"),
    run: async (interaction, data) => {
        try {
            await interaction.deferReply({flags: MessageFlagsBitField.Flags.Ephemeral});
            const users = await UserModel.find({banCounterAbandon: {"$exists": false}});
            for (let user of users) {
                user.banCounterAbandon = 0;
                user.banCounterFail = 0;
                await updateUser(user, data);
            }
            await interaction.followUp({flags: MessageFlagsBitField.Flags.Ephemeral, content: "done"});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "fix_counters",
    allowedUsers: [tokens.Parl],
}