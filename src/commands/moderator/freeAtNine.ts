import {SubCommand} from "../../interfaces/Command";
import {userOption} from "../../utility/options";
import tokens from "../../tokens";
import {SlashCommandSubcommandBuilder} from "@discordjs/builders";
import {EmbedBuilder, TextChannel, MessageFlagsBitField} from "discord.js";
import {createActionUser} from "../../modules/constructors/createAction";
import {Actions} from "../../database/models/ActionModel";
import {getStats} from "../../modules/getters/getStats";
import moment from "moment";
import {getUserByUser} from "../../modules/getters/getUser";
import {updateUser} from "../../modules/updaters/updateUser";

export const freeAtNine: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('free_at_nine')
        .setDescription('If queue is at 9, puts user in and removes cooldown')
        .addUserOption(userOption('User to free at 9')),
    run: async (interaction, data) => {
        await interaction.deferReply();
        try {
            const dbUser = await getUserByUser(interaction.options.getUser('user', true), data);
            // 1. User Registration and Profile Checks
            if (!dbUser.oculusName) {
                await interaction.followUp({content: `<@${dbUser.id}> needs to set a name using /register before queueing.`, flags: MessageFlagsBitField.Flags.Ephemeral});
                return;
            }
            if (!dbUser.region) {
                await interaction.followUp({content: `<@${dbUser.id}> must set a region before they can play.`, flags: MessageFlagsBitField.Flags.Ephemeral});
                return;
            }
            // 2. If frozen
            if (dbUser.frozen) {
                await interaction.followUp({content: `<@${dbUser.id}> is frozen.`, flags: MessageFlagsBitField.Flags.Ephemeral});
                return;
            }
            // 3. If not on cooldown (banUntil in the past or 0)
            if (!dbUser.banUntil || dbUser.banUntil < Date.now() / 1000) {
                await interaction.followUp({content: `<@${dbUser.id}> is not on cooldown.`, flags: MessageFlagsBitField.Flags.Ephemeral});
                return;
            }
            const queueController = data.getQueue();
            // 4. Queue Generation State
            if (queueController.generating) {
                await interaction.followUp({content: `Queue is currently generating a match. Please try again in a couple seconds.`, flags: MessageFlagsBitField.Flags.Ephemeral});
                return;
            }
            // 5. Auto Queue State
            if (queueController.activeAutoQueue) {
                await interaction.followUp({content: `There is an auto queue in progress. Please wait for it to finish.`, flags: MessageFlagsBitField.Flags.Ephemeral});
                return;
            }
            // 6. If queue is not at 9
            if (queueController.inQueueNumber() !== 9) {
                await interaction.followUp({content: `Queue is not at 9 (currently ${queueController.inQueueNumber()}).`, flags: MessageFlagsBitField.Flags.Ephemeral});
                return;
            }
            // 7. If user is not in queue, add them directly
            const alreadyInQueue = queueController.inQueue.some(u => u.discordId === dbUser.id);
            if (!alreadyInQueue) {
                const stats = await getStats(dbUser._id, queueController.queueId);
                queueController.inQueue.push({
                    dbId: dbUser._id,
                    discordId: dbUser.id,
                    queueExpire: moment().unix() + 15 * 60,
                    mmr: stats.mmr,
                    name: dbUser.name,
                    region: dbUser.region,
                });
            }
            // 8. Remove cooldown (do not decrement ban counters)
            dbUser.banUntil = 0;
            await updateUser(dbUser, data);
            // 9. Log and reply
            const reason = `Freed at 9 by <@${interaction.user.id}>`;
            await createActionUser(Actions.RemoveCooldown, interaction.user.id, dbUser.id, reason, 'cooldown removed');
            const channel = await interaction.client.channels.fetch(tokens.ModeratorLogChannel) as TextChannel;
            const embed = new EmbedBuilder();
            embed.setTitle(`User ${dbUser.id} freed at 9`);
            embed.setDescription(`<@${dbUser.id}> was freed at 9 by <@${interaction.user.id}>`);
            await channel.send({embeds: [embed.toJSON()]});
            await interaction.followUp({content: `<@${dbUser.id}> has been freed at 9 and added to queue.`, flags: MessageFlagsBitField.Flags.Ephemeral});
        } catch (e) {
            await interaction.followUp({content: 'An error occurred while processing the command.', flags: MessageFlagsBitField.Flags.Ephemeral});
        }
    },
    name: 'free_at_nine',
    allowedRoles: tokens.Mods,
} 
