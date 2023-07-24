import {GameUser} from "../interfaces/Game";
import {getStats} from "../modules/getters/getStats";
import {StatsInt} from "../database/models/StatsModel";
import {win} from "../buttons/match/score/win";
import {updateStats} from "../modules/updaters/updateStats";

// elo constant is the base change for every game
const K = 40
// Placement multiplier
const placement = 1.5;
// Initial multiplier bonus
const bonus = 1.25;
// Spike multiplier bonus
const spikeMultiplier = 1.4;
const spikeThreshold = 80;
// Normal multiplier bonus
const normal = 1.1;


const calcMMRFactor = (player: StatsInt, depth: number) => {
    const avg = player.mmrHistory.slice(player.mmrHistory.length - depth).reduce((sum: number, currentValue) => {return sum + currentValue}, 0) / depth;
    let tempSum = 0;
    // Calculates deviation from mean for mmr history
    for (let value of player.mmrHistory.slice(player.mmrHistory.length - depth)) {
        tempSum += Math.pow((value - avg), 2);
    }
    // ratio of std dev to mean
    const sigma = Math.sqrt(tempSum / depth);
    // Helps to normalize mmr factors
    return Math.sqrt(sigma / avg);
}

const getMMRChanges = (team: StatsInt[], baseChange: number) => {
    let mmrChanges = [];
    // iterates through each user to apply individual mmr changes
    for (let player of team) {
        if (player.gamesPlayed <= 10) {
            // base mmr change for first ten games (placement)
            mmrChanges.push(placement * baseChange);
        } else if (player.gamesPlayed <= 30) {
            // additional bonus is to help settle into a proper mmr
            mmrChanges.push(bonus * baseChange);
        } else {
            if (player.mmr - player.mmrHistory[player.mmrHistory.length - 16] >= spikeThreshold) {
                // Will help to balance out spikes in player mmr
                const mmrFactor = calcMMRFactor(player, (player.mmrHistory.length < 50) ? player.mmrHistory.length : 50) + spikeMultiplier;
                mmrChanges.push(mmrFactor * baseChange);
            } else {
                // Will help to balance out spikes in player mmr
                const mmrFactor = calcMMRFactor(player, (player.mmrHistory.length < 50) ? player.mmrHistory.length : 50) + normal;
                mmrChanges.push(mmrFactor * baseChange);
            }
        }
    }
    return mmrChanges;
}

export const processMMR = async (users: GameUser[], scores: number[], queueId: string, scoreLimit: number): Promise<number[][]> => {
    let teamA: StatsInt[] = [];
    let teamB: StatsInt[] = [];
    for (let user of users) {
        if (user.team == 0) {
            teamA.push(await getStats(user.dbId, queueId));
        } else {
            teamB.push(await getStats(user.dbId, queueId));
        }
    }

    const winner = (scores[0] == scoreLimit) ? 0 : (scores[1] == scoreLimit) ? 1 : -1;

    // Calculates the amount a team won by on a 0-1 scale
    const winAmount = Math.abs(scores[0] - scores[1]) / scoreLimit * 0.3 + 0.7;
    // Calculates average mmr per team
    const teamAverages = [teamA.reduce((sum: number, currentValue) => {return sum + currentValue.mmr}, 0) / teamA.length, teamB.reduce((sum: number, currentValue) => {return sum + currentValue.mmr}, 0) / teamB.length]
    // Transforms ratings into a scaled number
    const transformedRatings = [10 ** (teamAverages[0] / 400), 10 ** (teamAverages[1] / 400)];
    // Calculates the expected score for each team on a 0-1
    const expectedScores = [transformedRatings[0] / (transformedRatings[0] + transformedRatings[1]), transformedRatings[1] / (transformedRatings[0] + transformedRatings[1])];
    // Sets expected win percent for each team for use in calculations
    let mmrScores: number[];

    if (winner == 0) {
        mmrScores = [winAmount, 1- winAmount];
    } else if (winner == 1) {
        mmrScores = [1 - winAmount, winAmount];
    } else {
        mmrScores = [0.5, 0.5];
    }
    // calculates base mmr change for the game
    const mmrChange = [K * (mmrScores[0] - expectedScores[0]), K * (mmrScores[0] - expectedScores[0])]


    const teamAChanges = getMMRChanges(teamA, mmrChange[0]);
    const teamBChanges = getMMRChanges(teamB, mmrChange[1]);

    const eloLeak = Math.abs(teamAChanges.reduce((previousValue, currentValue) => {return previousValue + currentValue}, 0)) - Math.abs(teamBChanges.reduce((previousValue, currentValue) => {return previousValue + currentValue}, 0))

    if (eloLeak < 0) {
        if (teamAChanges[0] < 0) {
            for (let i = 0; i < teamAChanges.length; i++) {
                teamAChanges[i] -= eloLeak / teamAChanges.length;
            }
        } else {
            for (let i = 0; i < teamAChanges.length; i++) {
                teamAChanges[i] += eloLeak / teamAChanges.length;
            }
        }
    } else {
        if (teamBChanges[0] < 0) {
            for (let i = 0; i < teamBChanges.length; i++) {
                teamBChanges[i] -= eloLeak / teamBChanges.length;
            }
        } else {
            for (let i = 0; i < teamBChanges.length; i++) {
                teamBChanges[i] += eloLeak / teamBChanges.length;
            }
        }
    }

    // applies mmr changes
    for (let i = 0; i < teamAChanges.length; i++) {
        teamA[i].mmr += teamAChanges[i];
        teamA[i].mmrHistory.push(teamA[i].mmr);
        teamA[i].ratingChange = teamAChanges[i];
        teamA[i].gamesPlayed++;

        teamB[i].mmr += teamBChanges[i];
        teamB[i].mmrHistory.push(teamB[i].mmr);
        teamB[i].ratingChange = teamBChanges[i];
        teamB[i].gamesPlayed++;


        if (winner == 0) {
            teamA[i].gameHistory.push("win");
            teamB[i].gameHistory.push("loss");
        } else if (winner == 1) {
            teamA[i].gameHistory.push("loss");
            teamB[i].gameHistory.push("win");
        } else {
            teamA[i].gameHistory.push('draw');
            teamB[i].gameHistory.push('draw');
        }

        await updateStats(teamA[i]);
        await updateStats(teamB[i]);

    }

    return [teamAChanges, teamBChanges];
}