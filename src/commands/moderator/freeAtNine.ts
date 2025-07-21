import {SubCommand} from "../../interfaces/Command";
import {userOption} from "../../utility/options";
import tokens from "../../tokens";
import {logError} from "../../loggers";
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
        .setName('freeatnine')
        .setDescription('If queue is at 9, puts user in and removes cooldown')
        .addUserOption(userOption('User to free at 9')),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.options.getUser('user', true), data);
            // 1. User Registration and Profile Checks
            if (!dbUser.oculusName) {
                await interaction.reply({content: `<@${dbUser.id}> needs to set a name using /register before queueing.`, ephemeral: true});
                return;
            }
            if (!dbUser.region) {
                await interaction.reply({content: `<@${dbUser.id}> must set a region before they can play.`, ephemeral: true});
                return;
            }
            // 2. If frozen
            if (dbUser.frozen) {
                await interaction.reply({content: `<@${dbUser.id}> is frozen.`, ephemeral: true});
                return;
            }
            // 3. If not on cooldown (banUntil in the past or 0)
            if (dbUser.banUntil <= moment().unix()) {
                await interaction.reply({content: `<@${dbUser.id}> is not on cooldown.`, ephemeral: true});
                return;
            }
            const queueController = data.getQueue();
            // 4. Queue Generation State
            if (queueController.generating) {
                await interaction.reply({content: `Queue is currently generating a match. Please try again in a couple seconds.`, ephemeral: true});
                return;
            }
            // 5. Auto Queue State
            if (queueController.activeAutoQueue) {
                await interaction.reply({content: `There is an auto queue in progress. Please wait for it to finish.`, ephemeral: true});
                return;
            }
            // 6. If queue is not at 9
            if (queueController.inQueueNumber() !== 9) {
                await interaction.reply({content: `Queue is not at 9 (currently ${queueController.inQueueNumber()}).`, ephemeral: true});
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
            await interaction.reply({content: `<@${dbUser.id}> has been freed at 9 and added to queue.`, ephemeral: true});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'freeAtNine',
    allowedRoles: tokens.Mods,
} 
