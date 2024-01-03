import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {userOption} from "../../utility/options";
import {logError} from "../../loggers";
import tokens from "../../tokens";
import * as discordTranscripts from "discord-html-transcripts";

export const checkDms: Command = {
    data: new SlashCommandBuilder()
        .setName('check_dms')
        .setDescription("Displays a user's dms with the bot")
        .addUserOption(userOption("User to view dms of")),
    run: async (interaction) => {
        try {
            const dmChannel = interaction.options.getUser('user', true).dmChannel;
            if (!dmChannel) {
                await interaction.reply({ephemeral: true, content: "user has no dms with the bot"});
            } else {
                await interaction.deferReply({ephemeral: true})
                const messages = await dmChannel.messages.fetch();
                const attachment = await discordTranscripts.generateFromMessages(messages, dmChannel);
                await interaction.followUp({ephemeral: true, content: "Transcript as html", files: [attachment]});
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "check_dms",
    allowedRoles: [tokens.LeadModRole],
}