import {Command} from "../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {SlashCommandStringOption, TextChannel} from "discord.js";
import {logError} from "../loggers";
import tokens from "../tokens";
import moment from "moment-timezone";
import MapTestModel from "../database/models/MapTestModel";
import {v4 as uuidV4} from "uuid";
import {MapTestEmbed} from "../embeds/mapTest.embeds";
import {MapTestView} from "../views/staticViews";

export const createMapTest: Command = {
    data: new SlashCommandBuilder()
        .setName("create_map_test")
        .setDescription("Creates a map test event and posts it")
        .addStringOption(new SlashCommandStringOption()
            .setName("map")
            .setDescription("The map that will be played")
            .setRequired(true))
        .addStringOption(new SlashCommandStringOption()
            .setName("date")
            .setDescription("The date for the map test (MM/DD/YYYY)")
            .setRequired(true)
            .setMinLength(10)
            .setMaxLength(10))
        .addStringOption(new SlashCommandStringOption()
            .setName("time")
            .setDescription("The time for the map test in EST/EDT and 24hr format (hh:mm)")
            .setRequired(true)
            .setMinLength(5)
            .setMaxLength(5))
        .addStringOption(new SlashCommandStringOption()
            .setName("description")
            .setDescription("A short description of what will be tested")
            .setRequired(true)),
    run: async (interaction) => {
        try {
            await interaction.deferReply({ephemeral: true});
            const map = interaction.options.getString("map", true);
            const date = interaction.options.getString("date", true);
            const time = interaction.options.getString("time", true);
            const description = interaction.options.getString("description", true);
            try {
                moment.tz.setDefault("America/New_York")
                const timestamp = moment(`${date} ${time}`, "MM/DD/YYYY hh:mm").unix();
                const id = uuidV4();

                const channel = await interaction.guild!.channels.fetch(tokens.MapTestAnnouncementChannel) as TextChannel;
                const message = await channel.send({
                    content: `<@&${tokens.MapTesterRole}> A new map test is taking place at <t:${timestamp}:F>, signup below!`,
                    embeds: [MapTestEmbed(interaction.user.id, [], timestamp, map, description, id)],
                    components: [MapTestView()],
                });

                await MapTestModel.create({
                    id: id,
                    players: [],
                    time: timestamp,
                    description: description,
                    owner: interaction.user.id,
                    map: map,
                    messageId: message.id,
                    pinged: false,
                });
                await interaction.followUp({ephemeral: true, content: "Created Map Signup"})
            } catch (e) {
                await interaction.followUp({ephemeral: true, content: "Invalid date and or time provided"})
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "create_map_test",
    allowedRoles: tokens.Mods.concat([tokens.OwnerRole, tokens.MapMakerRole, tokens.LeadModRole])
}