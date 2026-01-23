import {SlashCommandBuilder} from "@discordjs/builders";
import {getUserByUser} from "../../modules/getters/getUser";
import {Command} from "../../interfaces/Command";
import tokens from "../../tokens";

export const setFreeStatus: Command = {
    data: new SlashCommandBuilder()
        .setName("set_free_status")
        .setDescription("Sets the free status of a user")
        .addUserOption(option => option.setName("user").setDescription("User to set free status of").setRequired(true))
        .addBooleanOption(option => option.setName("free").setDescription("Whether the user is free").setRequired(true)),
    run: async (interaction, data) => {
        const user = interaction.options.getUser("user", true);
        const free = interaction.options.getBoolean("free", true);
        const userDoc = await getUserByUser(user, data);
        if (!userDoc) {
            await interaction.reply("User not found");
            return;
        }
        userDoc.canBeFreed = free;
        await userDoc.save();
        if (free) {
            await interaction.reply(`Set ${user.username} to be freeable when the q is at 9.`);
        } else { 
            await interaction.reply(`Set ${user.username} to be unfreeable when the q is at 9.`);
        }
        
    },
    name: "set_free_status",
    allowedRoles: [tokens.AdminRole, tokens.OwnerRole]
}
