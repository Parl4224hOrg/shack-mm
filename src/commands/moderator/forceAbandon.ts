import {SubCommand} from "../../interfaces/Command";
import {reason, userOption} from "../../utility/options";
import tokens from "../../tokens";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {Regions} from "../../database/models/UserModel";
import {createAction} from "../../modules/constructors/createAction";
import {Actions} from "../../database/models/ActionModel";
import {SlashCommandSubcommandBuilder} from "discord.js";
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
                await game.abandon({dbId: dbUser._id, discordId: dbUser.id, team: -1, accepted: false, region: Regions.APAC, joined: false}, false, true);
                if (isReferee) {
                    await createAction(Actions.ForceAbandon, 'by Referee', reason, `<@${dbUser.id}> force abandoned from game ${game.id}`);
                } else { 
                    await createAction(Actions.ForceAbandon, interaction.user.id, reason, `<@${dbUser.id}> force abandoned from game ${game.id}`);
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
                await interaction.reply({ ephemeral: true, content: "Force abandon is working" });
                await interaction.followUp({ephemeral: false, content: `<@${dbUser.id}> has been abandoned`});
            } else {
                await interaction.reply({ephemeral: true, content: 'User not in a game'});
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'force_abandon',
    allowedRoles: tokens.Mods
}
