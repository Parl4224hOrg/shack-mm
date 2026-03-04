import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import tokens from "../../tokens";
import {logError} from "../../loggers";
import {CategoryChannel, TextChannel} from "discord.js";
import {Heap} from "../../utility/Heap";

type Ticket = {
    channelId: string;
    lastMessageTimestamp: number;
}

export const ticketDelete: Command = {
    data: new SlashCommandBuilder()
        .setName('ticket-delete')
        .setDescription("Deletes old tickets"),
    run: async (interaction) => {
        try {
            await interaction.deferReply();
            const maxHeap = new Heap<Ticket>((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
            for (const categoryId of tokens.TicketArchiveCategories) {
                const category = await interaction.client.channels.fetch(categoryId) as CategoryChannel;
                for (let channel of category.children.cache.values()) {
                    channel = channel as TextChannel;
                    const lastMessage = await channel.messages.fetch({ limit: 1});
                    if (lastMessage.size > 0) {
                        maxHeap.add({
                            channelId: channel.id,
                            lastMessageTimestamp: lastMessage.first()?.createdTimestamp ?? 0
                        });
                    }
                }
            }

            let message = "Tickets to Delete:";
            for (let i = 0; i < 100; i++) {
                const ticket = maxHeap.remove();
                if (!ticket) break;
                // await interaction.guild!.channels.delete(ticket.channelId);
                message += `\n<#${ticket.channelId}>`;
            }
            await interaction.followUp(message);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    allowedRoles: [tokens.AdminRole],
    name: 'ticket-delete',
}