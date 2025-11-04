import { SubCommand } from "../../interfaces/Command";
import { userOption } from "../../utility/options";
import { MessageFlagsBitField, SlashCommandStringOption, SlashCommandSubcommandBuilder } from "discord.js";
import { logError, logSMMInfo } from "../../loggers";
import tokens from "../../tokens";
import { getUserByUser } from "../../modules/getters/getUser";
import { Regions } from "../../database/models/UserModel";
import { updateUser } from "../../modules/updaters/updateUser";

export const setRegion: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName("set_region")
        .setDescription("Set's a user's region")
        .addUserOption(userOption("user to set region of"))
        .addStringOption(new SlashCommandStringOption()
            .setName('region')
            .setDescription("region to set")
            .setRequired(true)
            .setChoices({
                name: "NAE",
                value: "NAE"
            }, {
                name: "NAW",
                value: "NAW"
            }, {
                name: "EUE",
                value: "EUE"
            }, {
                name: "EUW",
                value: "EUW",
            }, {
                name: "APAC",
                value: "APAC"
            }
            )),
    run: async (interaction, data) => {
        try {
            const member = await interaction.guild!.members.fetch(interaction.options.getUser('user', true));
            for (let role of member.roles.cache.keys()) {
                if (tokens.RegionRoleArray.includes(role)) {
                    await member.roles.remove(role, "remove region role");
                }
            }
            const user = interaction.options.getUser('user', true);
            const dbUser = await getUserByUser(user, data);
            switch (interaction.options.getString('region', true)) {
                case "NAE": dbUser.region = Regions.NAE; await member.roles.add(tokens.RegionRoles.NAE); break;
                case "NAW": dbUser.region = Regions.NAW; await member.roles.add(tokens.RegionRoles.NAW); break;
                case "EUE": dbUser.region = Regions.EUE; await member.roles.add(tokens.RegionRoles.EUE); break;
                case "EUW": dbUser.region = Regions.EUW; await member.roles.add(tokens.RegionRoles.EUW); break;
                case "APAC": dbUser.region = Regions.APAC; await member.roles.add(tokens.RegionRoles.APAC); break;
            }
            await updateUser(dbUser, data);
            await interaction.reply({ flags: MessageFlagsBitField.Flags.Ephemeral, content: "updated user's region" });

            //log the cmd
            let logMessage = `<@${interaction.user.id}> set <@${user.id}>'s region to ${dbUser.region}.`;
            let modAction = `${interaction.user.displayName} used set_region`;
            await logSMMInfo(logMessage, interaction.client, modAction);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: "set_region",
    allowedRoles: tokens.Mods,
}