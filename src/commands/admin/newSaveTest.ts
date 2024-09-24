import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {logError} from "../../loggers";
import Serializer from "../../serializers/GameController.serializer";
import SaveV2Model from "../../database/models/SaveV2Model";
import tokens from "../../tokens";

export const newSaveTest: Command = {
    data: new SlashCommandBuilder()
        .setName("new-save-test")
        .setDescription("Tests the new save system"),
    run: async (interaction, data) => {
        try {
            await interaction.deferReply({ephemeral: true});
            const game = data.getQueue().activeGames[0];
            if (game) {
                const serializedData = Serializer.serialize(game);
                const save = await SaveV2Model.create({
                    id: new Date().getTime(),
                    data: serializedData,
                });
                let replyMessage = `Successfully saved data with id: ${save.id}\n`;
                try {
                    await Serializer.deserialize(save.data, interaction.client, data);
                    replyMessage += "Successfully loaded data as well";
                } catch (e) {
                    const temp = e as any
                    replyMessage += `Unsuccessfully loaded data with error: ${temp.message}`;
                }
                await interaction.followUp({ephemeral: true, content: replyMessage});
            } else {
                await interaction.followUp({ephemeral: true, content: "No active game to test serialization with"})
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'new-save-test',
    allowedRoles: [tokens.LeadModRole, tokens.AdminRole],
}