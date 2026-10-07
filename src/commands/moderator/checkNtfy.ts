import {randomInt} from "crypto";
import {MessageFlagsBitField, SlashCommandSubcommandBuilder} from "discord.js";
import {SubCommand} from "../../interfaces/Command";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {postNtfyNotification} from "../../modules/ntfy";
import tokens from "../../tokens";
import {userOption} from "../../utility/options";

export const checkNtfy: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName("check_ntfy")
        .setDescription("Send an ntfy verification notification to a user")
        .addUserOption(userOption("User whose ntfy setup should be checked")),
    run: async (interaction, data) => {
        try {
            const user = interaction.options.getUser("user", true);
            const dbUser = await getUserByUser(user, data);
            const code = randomInt(1_000, 10_000).toString();

            await postNtfyNotification(
                dbUser.ntfyId,
                `Your verification code is ${code}`,
                `https://discord.com/channels/${tokens.GuildID}/${tokens.SNDChannel}`,
                "default",
                "NTFY Verification",
            );
            await interaction.reply({content: "Notification sent."});
            await interaction.followUp({
                flags: MessageFlagsBitField.Flags.Ephemeral,
                content: `Verification code sent to <@${user.id}>: ${code}`,
            });
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "check_ntfy",
    allowedRoles: tokens.Mods,
};
