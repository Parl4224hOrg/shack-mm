import {Command} from "../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {SlashCommandBooleanOption, SlashCommandStringOption, TextChannel} from "discord.js";
import {logError, logWarn} from "../loggers";
import tokens from "../tokens";
import moment from "moment-timezone";
import MapTestModel from "../database/models/MapTestModel";
import {MapTestEmbed} from "../embeds/mapTest.embeds";
import {MapTestView} from "../views/staticViews";
import mapTestModel from "../database/models/MapTestModel";

export const updateMapTest: Command = {
    data: new SlashCommandBuilder()
        .setName("update_map_test")
        .setDescription("Creates a map test event and posts it")
        .addStringOption(new SlashCommandStringOption()
            .setName("message_id")
            .setDescription("The message id of the map test embed")
            .setRequired(true))
        .addBooleanOption(new SlashCommandBooleanOption()
            .setName("delete")
            .setDescription("Whether or not to delete map test")
            .setRequired(true))
        .addStringOption(new SlashCommandStringOption()
            .setName("map")
            .setDescription("The map that will be played")
            .setRequired(false))
        .addStringOption(new SlashCommandStringOption()
            .setName("date")
            .setDescription("The date for the map test (MM/DD/YYYY)")
            .setRequired(false)
            .setMinLength(10)
            .setMaxLength(10))
        .addStringOption(new SlashCommandStringOption()
            .setName("time")
            .setDescription("The time for the map test in EST/EDT and 24hr format (hh:mm)")
            .setRequired(false)
            .setMinLength(5)
            .setMaxLength(5))
        .addStringOption(new SlashCommandStringOption()
            .setName("description")
            .setDescription("A short description of what will be tested")
            .setRequired(false)),
    run: async (interaction) => {
        try {
            await interaction.deferReply({ephemeral: true});

            const messageId = interaction.options.getString("message_id", true);
            const deleteTest = interaction.options.getBoolean("delete", true);

            const testDoc = await MapTestModel.findOne({messageId: messageId});

            if (!testDoc) {
                await interaction.followUp({ephemeral: true, content: "Could not find test matching message id"});
                return;
            }

            const member = await interaction.guild!.members.fetch(interaction.user.id);
            const roles = member.roles.cache.map((value) => {return value.id} );
            if (!(testDoc.owner == interaction.user.id) && !roles.includes(tokens.ModRole)) {
                await interaction.followUp({ephemeral: true, content: "You cannot update a match test that you did not create"})
            }

            let dmMessage = "";
            const map = interaction.options.getString("map");
            const date = interaction.options.getString("date");
            const time = interaction.options.getString("time");
            const description = interaction.options.getString("description");

            const channel = await interaction.client.channels.fetch(tokens.MapTestAnnouncementChannel) as TextChannel;
            const message = await channel.messages.fetch(messageId);
            if (deleteTest) {
                dmMessage = `The map test for: ${testDoc.map}\nAt: <t:${testDoc.time}:F> has been cancelled`;
                testDoc.deleted = true;
                try {
                    await message.delete();
                } catch (e) {
                    await logWarn("Failed to delete map test message", interaction.client);
                }
            } else {
                if (map) {
                    dmMessage += `The map of the play test has changed from ${testDoc.map} to ${map}`;
                    testDoc.map = map;
                }
                if (date && time) {
                    try {
                        const oldTime = testDoc.time;
                        moment.tz.setDefault("America/New_York")
                        testDoc.time = moment(`${date} ${time}`, "MM/DD/YYYY hh:mm").unix();
                        dmMessage += `\nThe test play of ${testDoc.map} is now at <t:${testDoc.time}:F> <t:${testDoc.time}:R> instead of <t:${oldTime}:F>`;
                    } catch (e) {
                        await interaction.followUp({ephemeral: true, content: "Invalid date and or time provided"})
                    }
                }
                if (description) {
                    testDoc.description = description;
                    dmMessage += `The description of the map test has changed https://discord.com/channels/${tokens.GuildID}/${tokens.MapTestAnnouncementChannel}/${messageId}`
                }
                await message.edit({
                    content: message.content,
                    embeds: [MapTestEmbed(testDoc.owner, testDoc.players, testDoc.time, testDoc.map, testDoc.description, testDoc.id)],
                    components: [MapTestView()],
                });
            }

            for (let player of testDoc.players) {
                const user = await interaction.client.users.fetch(player);
                if (user.dmChannel) {
                    await user.dmChannel.send(dmMessage);
                } else {
                    await user.createDM(true);
                    await user.dmChannel!.send(dmMessage);
                }
            }
            await mapTestModel.findByIdAndUpdate(testDoc._id, testDoc);
            await interaction.followUp({ephemeral:true, content: "Your changes have been made and players currently signed up have been notified"});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "update_map_test",
    allowedRoles: tokens.Mods.concat([tokens.OwnerRole, tokens.MapMakerRole, tokens.LeadModRole])
}