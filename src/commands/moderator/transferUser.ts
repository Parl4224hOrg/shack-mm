import {SubCommand} from "../../interfaces/Command";
import {MessageFlagsBitField, SlashCommandSubcommandBuilder, SlashCommandUserOption} from "discord.js";
import tokens from "../../tokens";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {getStats} from "../../modules/getters/getStats";
import {updateStats} from "../../modules/updaters/updateStats";
import {updateUser} from "../../modules/updaters/updateUser";
import ActionModel from "../../database/models/ActionModel";
import WarnModel from "../../database/models/WarnModel";

export const transferUser: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('transfer_user')
        .setDescription("Transfers a user's stats")
        .addUserOption(new SlashCommandUserOption()
            .setName('old_user')
            .setDescription("The User's old account or <@id> if account is no longer in server")
            .setRequired(true))
        .addUserOption(new SlashCommandUserOption()
            .setName('new_user')
            .setDescription("The User's new account")
            .setRequired(true)),
    run: async (interaction, data) => {
        try {
            await interaction.deferReply()
            const oldUser = await getUserByUser(interaction.options.getUser('old_user', true), data);
            const newUser = await getUserByUser(interaction.options.getUser('new_user', true), data);

            // Transfer user data
            newUser.banUntil = oldUser.banUntil;
            newUser.lastBan = oldUser.lastBan;
            newUser.banCounterAbandon = oldUser.banCounterAbandon;
            newUser.banCounterFail = oldUser.banCounterFail;
            newUser.oculusName = oldUser.oculusName;
            newUser.dmMatch = oldUser.dmMatch;
            newUser.dmQueue = oldUser.dmQueue;
            newUser.dmAuto = oldUser.dmAuto;
            newUser.lastReduction = oldUser.lastReduction;
            newUser.gamesPlayedSinceReduction = oldUser.gamesPlayedSinceReduction;
            newUser.lastReductionAbandon = oldUser.lastReductionAbandon;
            newUser.gamesPlayedSinceReductionAbandon = oldUser.gamesPlayedSinceReductionAbandon;
            newUser.lastReductionFail = oldUser.lastReductionFail;
            newUser.gamesPlayedSinceReductionFail = oldUser.gamesPlayedSinceReductionFail;
            newUser.requeue = oldUser.requeue;
            newUser.frozen = oldUser.frozen;
            newUser.region = oldUser.region;
            newUser.muteUntil = oldUser.muteUntil;
            newUser.lates = oldUser.lates;
            newUser.lateTimes = oldUser.lateTimes;
            newUser.referee = oldUser.referee;
            await updateUser(newUser, data)

            // transfer stats
            const stats = await getStats(oldUser._id, "SND");
            stats.userId = newUser._id;
            await updateStats(stats);

            // Transfer Actions and warnings
            await ActionModel.updateMany({userId: oldUser.id}, {"$set": {"userId": newUser.id}});
            await WarnModel.updateMany({userId: oldUser._id}, {"$set": {"userId": newUser._id}});

            await interaction.guild!.members.kick(oldUser.id, "Remove transferred user from server")

            await interaction.followUp({flags: MessageFlagsBitField.Flags.Ephemeral, content: `<@${oldUser.id}> has been transferred to <@${newUser.id}>`})
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'transfer_user',
    allowedRoles: tokens.Mods,
}
