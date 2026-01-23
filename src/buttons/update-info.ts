import {Button} from "../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle, Message, MessageFlagsBitField, TextChannel} from "discord.js";
import tokens from "../tokens";
import {logError} from "../loggers";

export const updateInfo: Button = {
    data: new ButtonBuilder()
        .setLabel("Update Info")
        .setStyle(ButtonStyle.Primary)
        .setCustomId("update-info"),
    run: async (interaction) => {
        try {
            const channel = interaction.channel;
            if (!channel) {
                await interaction.reply({content: "Failed to find channel", flags: MessageFlagsBitField.Flags.Ephemeral});
                return;
            }
            await interaction.deferReply({flags: MessageFlagsBitField.Flags.Ephemeral});
            const messages = await channel.messages.fetch({limit: 100});

            const infoMessages: Message[] = [];
            for (const message of messages.values()) {
                if (message.author.bot) continue;
                infoMessages.push(message);
            }
            infoMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

            const infoChannel = await interaction.client.channels.fetch(tokens.InfoChannel) as TextChannel;
            const infoChannelMessages = await infoChannel.messages.fetch({limit: 100});

            if (infoChannelMessages.size != infoMessages.length) {
                for (const message of infoChannelMessages.values()) {
                    await message.delete();
                }
                for (const message of infoMessages) {
                    await infoChannel.send(message.content);
                }
                await interaction.followUp({content: "Updated info channel, deleted and resent messages"});
            } else {
                const orderedInfoChannelMessages = Array.from(infoChannelMessages.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp);

                for (let i = 0; i < infoMessages.length; i++) {
                    await orderedInfoChannelMessages[i].edit({content: infoMessages[i].content});
                }
                await interaction.followUp({content: "Updated info channel, edited messages"});
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: "update-info",
    allowedRoles: [tokens.AdminRole]
}