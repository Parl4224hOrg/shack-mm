import { ChannelType } from "discord.js";
import {SubCommand} from "../../interfaces/Command";
import {reason, userOption} from "../../utility/options";
import {logError} from "../../loggers";
import tokens from "../../tokens";
import moment from "moment";
import {getUserByUser} from "../../modules/getters/getUser";
import {grammaticalTime} from "../../utility/grammatical";
import {createActionUser} from "../../modules/constructors/createAction";
import {Actions} from "../../database/models/ActionModel";
import {SlashCommandStringOption, SlashCommandSubcommandBuilder} from "discord.js";
import {punishment} from "../../utility/punishment";
import {Client, EmbedBuilder, TextChannel} from "discord.js";

export const cooldown: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName("cooldown")
        .setDescription("Cooldown a user based on ban counter")
        .addUserOption(userOption("User to cooldown"))
        .addStringOption(new SlashCommandStringOption()
            .setName('action_type')
            .setDescription("Action that was deserving of cooldown")
            .setChoices(
                {
                    name: "Minor Action",
                    value: "1"
                }, {
                    name: "Major Action",
                    value: "3"
                }, {
                    name: "Extenuating Major Action",
                    value: "2"
                }
            )
            .setRequired(true))
        .addStringOption(reason),
    run: async (interaction, data) => {
        try {
            let reason = interaction.options.getString('reason', true);
            let user = await getUserByUser(interaction.options.getUser('user', true), data);
            const now = moment().unix();
            const severity = Number(interaction.options.getString("action_type", true)) ?? 0;
            user = await punishment(user, data, false, severity, now);
            let action;
            if (severity == 1) {
                action = "Minor";
            } else if (severity == 2) {
                action = "Extenuating Major"
            } else {
                action = "Major"
            }
            await createActionUser(Actions.Cooldown, interaction.user.id, user.id,interaction.options.getString('reason', true), `Cooldown that scales with ban counter for ${user.banUntil - now} seconds, it was a ${action} action`);
            if (interaction.channel?.type === ChannelType.GuildPublicThread ||
                interaction.channel?.type === ChannelType.GuildPrivateThread ||
                interaction.channel?.type === ChannelType.GuildNewsThread) {
                await interaction.reply({content: `<${user.id}> has been cooldowned for ${grammaticalTime(user.banUntil - now)}, it was a ${action} action`});
            } else {
                await interaction.reply({content: `<@${user.id}> has been cooldowned for ${grammaticalTime(user.banUntil - now)}, it was a ${action} action`});
            }
            await interaction.reply({content: `<@${user.id}> has been cooldowned for ${grammaticalTime(user.banUntil - now)}, it was a ${action} action`});
            const channel = await interaction.client.channels.fetch(tokens.ModeratorLogChannel) as TextChannel;
            const embed = new EmbedBuilder();
            embed.setTitle(`User ${dbUser.id} has been cooldowned`);
            embed.setDescription(`<@${dbUser.id}> has been cooldowned for ${grammaticalTime(user.banUntil - now)}, it was a ${action} action by <@${interaction.user.id}> because: ${reason}`);
            await channel.send({embeds: [embed.toJSON()]});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'cooldown',
    allowedRoles: tokens.Mods,
}
