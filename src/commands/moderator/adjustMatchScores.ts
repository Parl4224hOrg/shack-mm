import {SubCommand} from "../../interfaces/Command";
import {MessageFlagsBitField, SlashCommandSubcommandBuilder} from "discord.js";
import tokens from "../../tokens";
import {getGameByMatchId} from "../../modules/getters/getGame";
import GameModel, {GameInt} from "../../database/models/GameModel";
import {Types} from "mongoose";
import {getUserById} from "../../modules/getters/getUser";
import {getStats} from "../../modules/getters/getStats";
import {RecalcUser} from "../../interfaces/Game";
import {recalcMMR} from "../../utility/processMMR";
import {updateStats} from "../../modules/updaters/updateStats";
import {updateGame} from "../../modules/updaters/updateGame";

const IncludesObjectId = (arr: Types.ObjectId[], includes: Types.ObjectId): boolean => {
    return arr.some((value) => value.equals(includes));
}

export const adjustMatchScores: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName("adjust_match_scores")
        .setDescription("Adjust the scores of an incorrectly submitted match")
        .addIntegerOption(opt => opt
            .setName('match_id')
            .setRequired(true)
            .setDescription('match id to submit match for')
        )
        .addIntegerOption(opt => opt
            .setName('score_a')
            .setRequired(true)
            .setDescription('score for team a')
            .setMinValue(0)
            .setMaxValue(10)
        )
        .addIntegerOption(opt => opt
            .setName('score_b')
            .setRequired(true)
            .setDescription('score for team a')
            .setMinValue(0)
            .setMaxValue(10)
        ),
    run: async (interaction, data) => {
        const match = await getGameByMatchId(interaction.options.getInteger('match_id', true));
        if (!match) {
            await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "Match could not be found"});
            return;
        }
        await interaction.deferReply();

        // Check if this match is the most recent complete game played by all users
        let futureMatches: GameInt[] = await GameModel.find({
            matchId: {$gt: match.matchId},
            scoreA: {$gte: 0},
            scoreB: {$gte: 0},
        });
        if (futureMatches.length > 0) {
            for (const futureMatch of futureMatches) {
                for (const user of futureMatch.users) {
                    if (IncludesObjectId(match.users, user._id)) {
                        await interaction.followUp({content: "This match can no longer have its scores adjusted as at least one user has participated in another game that has completed."})
                        return;
                    }
                }
            }
        }

        // Get all users that need to be adjusted
        const users: RecalcUser[] = [];
        for (const user of match.users) {
            const userDoc = await getUserById(user, data);
            users.push({
                dbId: user,
                discordId: userDoc.id,
                team: IncludesObjectId(match.teamA, user) ? 0 : 1,
                stats: await getStats(user, "SND")
            });
        }

        // Undo necessary changes to each user before recalc
        for (const user of users) {
            const stats = user.stats;

            stats.mmr -= stats.ratingChange;
            stats.mmrHistory.pop();
            stats.gamesPlayed--;
            stats.gamesPlayedSinceReset--;
            stats.gameHistory.pop();
        }

        // Recalc the mmr
        const scoreA = interaction.options.getInteger('score_a', true);
        const scoreB = interaction.options.getInteger('score_b', true);
        const result = await recalcMMR(
            users,
            [scoreA, scoreB],
            "SND",
            10
        );

        // Make required db updates
        for (const stats of result.stats) {
            await updateStats(stats);
        }
        match.teamAChanges = result.changes[0];
        match.teamBChanges = result.changes[1];
        match.scoreA = scoreA;
        match.scoreB = scoreA;
        await updateGame(match);

        // Update matches that have been generated since to have accurate mmr diffs
        futureMatches = await GameModel.find({
            matchId: {$gt: match.matchId}
        });
        for (const futureMatch of futureMatches) {
            let teamASum = 0;
            let teamBSum = 0;
            for (const user of futureMatch.teamA) {
                teamASum += (await getStats(user, "SND")).mmr;
            }
            for (const user of futureMatch.teamB) {
                teamBSum += (await getStats(user, "SND")).mmr;
            }
            futureMatch.mmrDiff = Math.abs(teamASum - teamBSum);
            await updateGame(futureMatch);
        }

        await interaction.followUp({content: `Successfully updated the scores of match ${match.matchId}`})
    },
    name: "adjust_match_scores",
    allowedRoles: tokens.Mods
}