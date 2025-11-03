import { SubCommand } from "../../interfaces/Command";
import { SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { EmbedBuilder, MessageFlagsBitField } from "discord.js";
import userModel from "../../database/models/UserModel";
import tokens from "../../tokens";
import { logSMMInfo } from "../../loggers";

export const troubleMakers: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('trouble_makers')
        .setDescription('Display all frozen and permanently muted users'),
    run: async (interaction) => {
        try {
            // Get frozen users count
            const frozenCount = await userModel.countDocuments({ frozen: true });

            // Get permanently muted users count (muteUntil = -1)
            const permanentlyMutedCount = await userModel.countDocuments({ muteUntil: -1 });

            const embed = new EmbedBuilder();
            embed.setTitle("🔍 Trouble Makers Report");
            embed.setColor(0xFF6B6B);
            embed.setTimestamp();

            embed.setDescription(`❄️ **Frozen Users:** ${frozenCount}\n🔇 **Permanently Muted Users:** ${permanentlyMutedCount}`);

            await interaction.reply({ embeds: [embed.toJSON()] });

            //log the cmd
            let logMessage = `<@${interaction.user.id}> used trouble_makers command.`;
            let modAction = `<@${interaction.user.id}> used trouble_makers`;
            await logSMMInfo(logMessage, interaction.client, modAction);
        } catch (e) {
            console.error("Error in troubleMakers command:", e);
            await interaction.followUp({
                content: "An error occurred while fetching trouble makers data.",
                flags: MessageFlagsBitField.Flags.Ephemeral
            });
        }
    },
    name: 'trouble_makers',
    allowedRoles: tokens.Mods.concat(tokens.OwnerRole),
} 
