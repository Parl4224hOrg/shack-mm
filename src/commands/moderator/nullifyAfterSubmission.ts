import {EmbedBuilder, MessageFlagsBitField, SlashCommandSubcommandBuilder, TextChannel} from "discord.js";
import {Types} from "mongoose";
import {SubCommand} from "../../interfaces/Command";
import tokens from "../../tokens";
import GameModel, {GameInt} from "../../database/models/GameModel";
import {getGameByMatchId} from "../../modules/getters/getGame";
import {getStats} from "../../modules/getters/getStats";
import {updateGame} from "../../modules/updaters/updateGame";
import {updateStats} from "../../modules/updaters/updateStats";
import {reason} from "../../utility/options";
import {createAction} from "../../modules/constructors/createAction";
import {Actions} from "../../database/models/ActionModel";
import {StatsInt} from "../../database/models/StatsModel";

const includesObjectId = (ids: Types.ObjectId[], id: Types.ObjectId): boolean => {
    return ids.some(value => value.equals(id));
}

const calculateWinRate = (wins: number, losses: number, draws: number): number => {
    const gamesPlayed = wins + losses + draws;
    return gamesPlayed === 0 ? 0 : (wins + draws / 2) / gamesPlayed;
}

const getPreviousRatingChange = (mmrHistory: number[]): number => {
    if (mmrHistory.length < 2) {
        return 0;
    }
    return mmrHistory[mmrHistory.length - 1] - mmrHistory[mmrHistory.length - 2];
}

const getChangeForUser = (match: GameInt, userId: Types.ObjectId): number | undefined => {
    const teamAIndex = match.teamA.findIndex(user => user.equals(userId));
    if (teamAIndex >= 0) {
        return match.teamAChanges[teamAIndex];
    }

    const teamBIndex = match.teamB.findIndex(user => user.equals(userId));
    if (teamBIndex >= 0) {
        return match.teamBChanges[teamBIndex];
    }

    return undefined;
}

export const nullifyAfterSubmission: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName("nullify_after_submission")
        .setDescription("Nullify a submitted match and reverse its MMR changes")
        .addIntegerOption(option => option
            .setName("match_id")
            .setDescription("Match ID to nullify")
            .setRequired(true)
        )
        .addStringOption(reason),
    run: async (interaction) => {
        const matchId = interaction.options.getInteger("match_id", true);
        const match = await getGameByMatchId(matchId);

        if (!match) {
            await interaction.reply({
                flags: MessageFlagsBitField.Flags.Ephemeral,
                content: "Match could not be found",
            });
            return;
        }

        await interaction.deferReply();

        if (match.nullified) {
            await interaction.followUp({content: `Match ${matchId} is already nullified.`});
            return;
        }

        if (match.scoreA < 0 || match.scoreB < 0) {
            await interaction.followUp({content: `Match ${matchId} has not been submitted.`});
            return;
        }

        const futureMatches: GameInt[] = await GameModel.find({
            matchId: {$gt: match.matchId},
            scoreA: {$gte: 0},
            scoreB: {$gte: 0},
            nullified: {$ne: true},
        });
        for (const futureMatch of futureMatches) {
            if (futureMatch.users.some(user => includesObjectId(match.users, user))) {
                await interaction.followUp({
                    content: "This match can no longer be nullified because at least one user has participated in another completed game.",
                });
                return;
            }
        }

        const statsByUser = new Map<string, StatsInt>();
        for (const userId of match.users) {
            const stats = await getStats(userId, match.queueId);
            if (
                getChangeForUser(match, userId) === undefined ||
                stats.gamesPlayed < 1 ||
                stats.mmrHistory.length < 2 ||
                stats.gameHistory.length < 1
            ) {
                await interaction.followUp({
                    content: `Match ${matchId} does not have complete rating history and cannot be safely nullified.`,
                });
                return;
            }
            statsByUser.set(userId.toString(), stats);
        }

        for (const userId of match.users) {
            const stats = statsByUser.get(userId.toString())!;
            const mmrChange = getChangeForUser(match, userId)!;

            stats.mmr -= mmrChange;
            stats.mmrHistory.pop();
            stats.gamesPlayed--;
            if (stats.gamesPlayedSinceReset > 0) {
                stats.gamesPlayedSinceReset--;
            }
            stats.gameHistory.pop();

            if (match.winner === 0) {
                includesObjectId(match.teamA, userId) ? stats.wins-- : stats.losses--;
            } else if (match.winner === 1) {
                includesObjectId(match.teamB, userId) ? stats.wins-- : stats.losses--;
            } else {
                stats.draws--;
            }

            stats.ratingChange = getPreviousRatingChange(stats.mmrHistory);
            stats.winRate = calculateWinRate(stats.wins, stats.losses, stats.draws);
            await updateStats(stats);
        }

        match.nullified = true;
        await updateGame(match);

        const generatedAfterMatch: GameInt[] = await GameModel.find({matchId: {$gt: match.matchId}});
        for (const futureMatch of generatedAfterMatch) {
            let teamASum = 0;
            let teamBSum = 0;
            for (const userId of futureMatch.teamA) {
                teamASum += (await getStats(userId, futureMatch.queueId)).mmr;
            }
            for (const userId of futureMatch.teamB) {
                teamBSum += (await getStats(userId, futureMatch.queueId)).mmr;
            }
            futureMatch.mmrDiff = Math.abs(teamASum - teamBSum);
            await updateGame(futureMatch);
        }

        const actionReason = interaction.options.getString("reason", true);
        await createAction(
            Actions.Nullify,
            interaction.user.id,
            actionReason,
            `Submitted game ${matchId} nullified and MMR reversed`,
        );

        const logChannel = await interaction.client.channels.fetch(tokens.ModeratorLogChannel) as TextChannel;
        const embed = new EmbedBuilder()
            .setTitle(`Game ${matchId} nullified after submission`)
            .setDescription(`Game ${matchId} was nullified by <@${interaction.user.id}> because: ${actionReason}`);
        await logChannel.send({embeds: [embed.toJSON()]});

        await interaction.followUp({content: `Successfully nullified match ${matchId} and reversed its MMR changes.`});
    },
    name: "nullify_after_submission",
    allowedRoles: tokens.Mods,
}
