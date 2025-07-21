import {SubCommand} from "../../interfaces/Command";
import {userOption} from "../../utility/options";
import tokens from "../../tokens";
import {logError, logInfo} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {updateUser} from "../../modules/updaters/updateUser";
import {SlashCommandSubcommandBuilder} from "@discordjs/builders";
import {EmbedBuilder, TextChannel} from "discord.js";
import {createActionUser} from "../../modules/constructors/createAction";
import {Actions} from "../../database/models/ActionModel";
import {getStats} from "../../modules/getters/getStats";
import moment from "moment";

export const freeAtNine: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('free_at_nine')
        .setDescription('If queue is at 9, puts user in and removes cooldown')
        .addUserOption(userOption('User to free at 9')),
    run: async (interaction, data) => {
        // Defensive check and logging for debugging
        if (!data) {
            await logInfo('freeAtNine: data object is undefined!', interaction.client);
            await interaction.reply({content: 'Internal error: data object missing.', ephemeral: true});
            return;
        }
        if (!('limiter' in data)) {
            await logInfo('freeAtNine: data.limiter is missing!', interaction.client);
        }
        try {
            await logInfo('freeAtNine: Fetching user from DB', interaction.client);
            const dbUser = await getUserByUser(interaction.options.getUser('user', true), data);
            // 1. User Registration and Profile Checks
            await logInfo('freeAtNine: Checking oculusName', interaction.client);
            if (!dbUser.oculusName) {
                await interaction.reply({content: `<@${dbUser.id}> needs to set a name using /register before queueing.`, ephemeral: true});
                await logInfo('freeAtNine: User missing oculusName, exiting', interaction.client);
                return;
            }
            await logInfo('freeAtNine: Checking region', interaction.client);
            if (!dbUser.region) {
                await interaction.reply({content: `<@${dbUser.id}> must set a region before they can play.`, ephemeral: true});
                await logInfo('freeAtNine: User missing region, exiting', interaction.client);
                return;
            }
            // 2. If frozen
            await logInfo('freeAtNine: Checking if user is frozen', interaction.client);
            if (dbUser.frozen) {
                await interaction.reply({content: `<@${dbUser.id}> is frozen.`, ephemeral: true});
                await logInfo('freeAtNine: User is frozen, exiting', interaction.client);
                return;
            }
            // 3. If not on cooldown (banUntil in the past or 0)
            await logInfo('freeAtNine: Checking if user is on cooldown', interaction.client);
            if (dbUser.banUntil <= moment().unix()) {
                await interaction.reply({content: `<@${dbUser.id}> is not on cooldown.`, ephemeral: true});
                await logInfo('freeAtNine: User not on cooldown, exiting', interaction.client);
                return;
            }
            const queueController = data.getQueue();
            // 4. Queue Generation State
            await logInfo('freeAtNine: Checking if queue is generating', interaction.client);
            if (queueController.generating) {
                await interaction.reply({content: `Queue is currently generating a match. Please try again in a couple seconds.`, ephemeral: true});
                await logInfo('freeAtNine: Queue is generating, exiting', interaction.client);
                return;
            }
            // 5. Auto Queue State
            await logInfo('freeAtNine: Checking if auto queue is active', interaction.client);
            if (queueController.activeAutoQueue) {
                await interaction.reply({content: `There is an auto queue in progress. Please wait for it to finish.`, ephemeral: true});
                await logInfo('freeAtNine: Auto queue active, exiting', interaction.client);
                return;
            }
            // 6. If queue is not at 9
            await logInfo('freeAtNine: Checking queue size', interaction.client);
            if (queueController.inQueueNumber() !== 9) {
                await interaction.reply({content: `Queue is not at 9 (currently ${queueController.inQueueNumber()}).`, ephemeral: true});
                await logInfo('freeAtNine: Queue not at 9, exiting', interaction.client);
                return;
            }
            // 7. If user is not in queue, add them directly
            await logInfo('freeAtNine: Checking if user is already in queue', interaction.client);
            const alreadyInQueue = queueController.inQueue.some(u => u.discordId === dbUser.id);
            if (!alreadyInQueue) {
                await logInfo('freeAtNine: User not in queue, adding', interaction.client);
                const stats = await getStats(dbUser._id, queueController.queueId);
                queueController.inQueue.push({
                    dbId: dbUser._id,
                    discordId: dbUser.id,
                    queueExpire: moment().unix() + 15 * 60,
                    mmr: stats.mmr,
                    name: dbUser.name,
                    region: dbUser.region,
                });
            } else {
                await logInfo('freeAtNine: User already in queue', interaction.client);
            }
            // 8. Remove cooldown (do not decrement ban counters)
            await logInfo('freeAtNine: Removing cooldown', interaction.client);
            dbUser.banUntil = 0;
            await updateUser(dbUser, data);
            // 9. Log and reply
            await logInfo('freeAtNine: Logging action and sending notifications', interaction.client);
            const reason = `Freed at 9 by <@${interaction.user.id}>`;
            await createActionUser(Actions.RemoveCooldown, interaction.user.id, dbUser.id, reason, 'cooldown removed');
            const channel = await interaction.client.channels.fetch(tokens.ModeratorLogChannel) as TextChannel;
            const embed = new EmbedBuilder();
            embed.setTitle(`User ${dbUser.id} freed at 9`);
            embed.setDescription(`<@${dbUser.id}> was freed at 9 by <@${interaction.user.id}>`);
            await channel.send({embeds: [embed.toJSON()]});
            await interaction.reply({content: `<@${dbUser.id}> has been freed at 9 and added to queue.`, ephemeral: true});
            await logInfo('freeAtNine: Command completed successfully', interaction.client);
        } catch (e) {
            await logInfo('freeAtNine: Caught error', interaction.client);
            await logError(e, interaction);
        }
    },
    name: 'freeAtNine',
    allowedRoles: tokens.Mods,
} 
