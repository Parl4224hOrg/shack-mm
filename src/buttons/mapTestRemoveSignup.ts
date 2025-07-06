import {Button} from "../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle, MessageFlagsBitField} from "discord.js";
import {logError} from "../loggers";
import MapTestModel from "../database/models/MapTestModel";
import {MapTestEmbed} from "../embeds/mapTest.embeds";
import {MapTestView} from "../views/staticViews";
import {logPlaytest} from "../utility/log.util";

export const mapTestRemoveSignup: Button = {
    data: new ButtonBuilder()
        .setLabel("Remove Signup")
        .setStyle(ButtonStyle.Danger)
        .setCustomId("match-test-remove-signup"),
    run: async (interaction) => {
        try {
            const id = interaction.message.embeds[0].footer!.text;
            const doc = await MapTestModel.findOne({id: id});
            if (!doc) {
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "Failed to find play test please contact parl"})
            } else {
                doc.players.forEach((player, i) => {if (player == interaction.user.id) doc.players.splice(i, 1)});
                await MapTestModel.findByIdAndUpdate(doc._id, doc);
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "Removed your signup if signed up"});
                await logPlaytest(interaction.user, true, doc.id, interaction.guild!);
                await interaction.message.edit({
                    content: interaction.message.content,
                    embeds: [MapTestEmbed(doc.owner, doc.players, doc.time, doc.map, doc.description, doc.id)],
                    components: [MapTestView()],
                });
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: "match-test-remove-signup"
}