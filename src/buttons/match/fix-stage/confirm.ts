import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle, TextChannel} from "discord.js";
import {Button} from "../../../interfaces/Button";
import {getUserByUser} from "../../../modules/getters/getUser";
import {logError} from "../../../loggers";
import tokens from "../../../tokens";

export const confirmFixStage: Button = {
    data: new ButtonBuilder()
        .setLabel("Confirm")
        .setStyle(ButtonStyle.Success)
        .setCustomId("confirm_fix_stage"),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user, data);
            const game = data.findGame(dbUser._id);
            if (!game) {
                await interaction.update({content: "Could not find game", components: []});
                return;
            }

            const channel = await interaction.client.channels.fetch(tokens.GameLogChannel) as TextChannel;
            await channel.send({
                content: `<@${interaction.user.id}> | ${interaction.user.id} | ${interaction.user.username}\nconfirmed stage fix | match: ${game.matchNumber} on server: ${game.server?.id ?? "not assigned"}`,
                allowedMentions: {users: []}
            });
            await interaction.update({content: "Fixing stage...", components: []});
            const response = await game.fixStage(dbUser._id);
            if (!response.success) {
                await interaction.followUp({content: response.message});
                return;
            }

            await interaction.followUp({content: response.message});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: "confirm_fix_stage",
}