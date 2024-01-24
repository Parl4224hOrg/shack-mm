import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {Regions} from "../../database/models/UserModel";

export const abandon: Command = {
    data: new SlashCommandBuilder()
        .setName('abandon')
        .setDescription('Abandons you from the game'),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user, data);
            const game = data.findGame(dbUser._id);
            if (game) {
                await interaction.deferReply();
                const res = await game.abandon({dbId: dbUser._id, discordId: dbUser.id, team: -1, accepted: false, region: Regions.APAC}, false);
                if (res) {
                    await interaction.followUp("You have abandoned the game");
                } else {
                    await interaction.followUp("You cannot abandon the game as a team has won at least 6 rounds");
                }
            } else {
                await interaction.reply({ephemeral: true, content: "Could not find game"});
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'abandon',
}