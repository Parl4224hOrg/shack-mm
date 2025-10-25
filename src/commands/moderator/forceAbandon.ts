import {SubCommand} from "../../interfaces/Command";
import {reason, userOption} from "../../utility/options";
import tokens from "../../tokens";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {Regions} from "../../database/models/UserModel";
import {createActionUser} from "../../modules/constructors/createAction";
import {Actions} from "../../database/models/ActionModel";
import {MessageFlagsBitField, SlashCommandSubcommandBuilder} from "discord.js";
import {EmbedBuilder, TextChannel} from "discord.js";


export const forceAbandon: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('force_abandon')
        .setDescription('Abandons a user from the match')
        .addUserOption(userOption('User to abandon'))
        .addStringOption(reason),
    run: async (interaction, data) => {
        try {
            // Check if the command was run under /ref or /mod
            const isReferee = interaction.commandName === 'ref';
            let reason = interaction.options.getString('reason', true);
            const dbUser = await getUserByUser(interaction.options.getUser('user', true), data);
            const game = data.findGame(dbUser._id);
            if (game) {
                await game.abandon({dbId: dbUser._id, discordId: dbUser.id, team: -1, accepted: false, region: Regions.APAC, joined: false, isLate: false, hasBeenGivenLate: false}, false, true, true);
                if (isReferee) {
                    await createActionUser(Actions.ForceAbandon, 'by Referee', dbUser.id, reason, `<@${dbUser.id}> force abandoned from game ${game.id}`);
                } else { 
                    await createActionUser(Actions.ForceAbandon, interaction.user.id, dbUser.id, reason, `<@${dbUser.id}> force abandoned from game ${game.id}`);
                }
                let channel: TextChannel;
                if (isReferee) {
                    channel = await interaction.client.channels.fetch(tokens.RefereeLogChannel) as TextChannel;
                } else { 
                    channel = await interaction.client.channels.fetch(tokens.ModeratorLogChannel) as TextChannel;
                }
                const embed = new EmbedBuilder();
                embed.setTitle(`User ${dbUser.id} has been force abandoned`);
                embed.setDescription(`<@${dbUser.id}> force abandoned by <@${interaction.user.id}> because: ${reason}`);
                await channel.send({embeds: [embed.toJSON()]});
                await interaction.reply({ flags: MessageFlagsBitField.Flags.Ephemeral, content: "Force abandon is working" });
                if (interaction.channel && interaction.channel.isSendable()) {
                    await interaction.channel.send({
                        content: `<@${dbUser.id}> has been abandoned`,
                        allowedMentions: {users: [dbUser.id]}
                    })
                } else {
                    await interaction.followUp({ flags: MessageFlagsBitField.Flags.Ephemeral, content: "cannot send message, command executed" });
                }
            } else {
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: 'User not in a game'});
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'force_abandon',
    allowedRoles: tokens.Mods
}
