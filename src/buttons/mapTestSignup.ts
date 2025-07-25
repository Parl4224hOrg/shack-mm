import {Button} from "../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {ButtonStyle, MessageFlagsBitField} from "discord.js";
import {logError} from "../loggers";
import MapTestModel from "../database/models/MapTestModel";
import {MapTestEmbed} from "../embeds/mapTest.embeds";
import {MapTestView} from "../views/staticViews";
import {logPlaytest} from "../utility/log.util";

export const mapTestSignup: Button = {
    data: new ButtonBuilder()
        .setLabel("Signup")
        .setStyle(ButtonStyle.Primary)
        .setCustomId("match-test-signup"),
    run: async (interaction) => {
        try {
            const id = interaction.message.embeds[0].footer!.text;
            const doc = await MapTestModel.findOne({id: id});
            if (!doc) {
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "Failed to find play test please contact parl"})
            } else {
                if (!doc.players.includes(interaction.user.id)) {
                    doc.players.push(interaction.user.id);
                }
                await MapTestModel.findByIdAndUpdate(doc._id, doc);
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "Added your signup if not already signed up"});
                await logPlaytest(interaction.user, false, doc.id, interaction.guild!);
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
    id: "match-test-signup"
}