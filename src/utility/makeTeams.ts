import {ids, QueueUser} from "../interfaces/Game";
import tokens from "../tokens";
import {Client, TextChannel, EmbedBuilder} from "discord.js";

export function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export const makeTeams = async (users: QueueUser[], client?: Client): Promise<{teamA: ids[], teamB: ids[], mmrDiff: number}> => {

    let length = users.length,
        permutations = [users.slice()],
        c = new Array(length).fill(0),
        i = 1, k, p;

    while (i < length) {
        if (c[i] < i) {
            k = i % 2 && c[i];
            p = users[i];
            users[i] = users[k];
            users[k] = p;
            ++c[i];
            i = 1;
            permutations.push(users.slice());
        } else {
            c[i] = 0;
            ++i;
        }
    }

    let bestDiff = 9999;
    let bestA: QueueUser[] = [];
    let bestB: QueueUser[] = [];

    for (let permutation of permutations) {
        let teamA = permutation.slice(0, tokens.PlayerCount/2);
        let teamB = permutation.slice(tokens.PlayerCount/2, tokens.PlayerCount);

        let aSum = 0;
        let bSum = 0;

        teamA.forEach(c => aSum += c.mmr);
        teamB.forEach(c => bSum += c.mmr);

        const diff = Math.abs(aSum - bSum)

        if (diff < bestDiff) {
            bestA = teamA;
            bestB = teamB;
            bestDiff = diff;
        }
    }

    let teamA: ids[] = [];
    let teamB: ids[] = [];

    bestA.forEach(c => teamA.push({db: c.dbId, discord: c.discordId, region: c.region}));
    bestB.forEach(c => teamB.push({db: c.dbId, discord: c.discordId, region: c.region}));

    // Log MMR difference to game-logs channel
    try {
        const channel = await client?.channels.fetch(tokens.GameLogChannel) as TextChannel;
        const embed = new EmbedBuilder();
        embed.setTitle("Teams Generated");
        embed.setDescription(`MMR Difference: ${bestDiff}`);
        
        let teamAStr = "";
        let teamBStr = "";
        bestA.forEach(user => teamAStr += `<@${user.discordId}> `);
        bestB.forEach(user => teamBStr += `<@${user.discordId}> `);
        
        embed.addFields(
            { name: "Team A", value: teamAStr, inline: true },
            { name: "Team B", value: teamBStr, inline: true }
        );
        
        await channel.send({embeds: [embed.toJSON()]});
    } catch (e) {
        console.error("Failed to log team generation:", e);
    }

    // Call the new method for comparison logging and get the MMR difference
    let topTwoSplitDiff = 0;
    try {
        const topTwoResult = await makeTeamsSplittingTopTwoPlayers(users, client);
        topTwoSplitDiff = topTwoResult.mmrDiff;
    } catch (e) {
        console.error("Failed to call makeTeamsSplittingTopTwoPlayers:", e);
    }
    
    // Log the comparison
    try {
        const channel = await client?.channels.fetch(tokens.GameLogChannel) as TextChannel;
        const embed = new EmbedBuilder();
        embed.setTitle("Team Generation Comparison");
        embed.setDescription(`makeTeams got a MMRDiff of ${bestDiff}, splitting the top 2 players got a MMRDiff of ${topTwoSplitDiff}, with a difference of ${Math.abs(bestDiff - topTwoSplitDiff)}`);
        embed.setColor(bestDiff < topTwoSplitDiff ? 0x00FF00 : 0xFF0000); // Green if original is better, red if top2 split is better
        
        await channel.send({embeds: [embed.toJSON()]});
    } catch (e) {
        console.error("Failed to log comparison:", e);
    }
    
    return {teamA: teamA, teamB: teamB, mmrDiff: bestDiff};
}

export const makeTeamsSplittingTopTwoPlayers = async (users: QueueUser[], client?: Client): Promise<{teamA: ids[], teamB: ids[], mmrDiff: number}> => {
    // Sort users by MMR (ELO) in descending order
    const sortedUsers = [...users].sort((a, b) => b.mmr - a.mmr);
    
    // Get the top 2 players
    const topPlayer1 = sortedUsers[0];
    const topPlayer2 = sortedUsers[1];
    
    // Get the remaining 8 players
    const remainingPlayers = sortedUsers.slice(2);
    
    // Initialize teams with top players
    let teamA: QueueUser[] = [topPlayer1];
    let teamB: QueueUser[] = [topPlayer2];
    
    // Calculate initial MMR sums
    let teamAMmr = topPlayer1.mmr;
    let teamBMmr = topPlayer2.mmr;
    
    // Generate all permutations of the remaining 8 players
    let length = remainingPlayers.length;
    let permutations = [remainingPlayers.slice()];
    let c = new Array(length).fill(0);
    let i = 1, k, p;
    
    while (i < length) {
        if (c[i] < i) {
            k = i % 2 && c[i];
            p = remainingPlayers[i];
            remainingPlayers[i] = remainingPlayers[k];
            remainingPlayers[k] = p;
            ++c[i];
            i = 1;
            permutations.push(remainingPlayers.slice());
        } else {
            c[i] = 0;
            ++i;
        }
    }
    
    let bestDiff = 9999;
    let bestRemainingA: QueueUser[] = [];
    let bestRemainingB: QueueUser[] = [];
    
    // Try all permutations to find the best balance for remaining players
    for (let permutation of permutations) {
        let remainingTeamA = permutation.slice(0, 4); // 4 players for team A
        let remainingTeamB = permutation.slice(4, 8); // 4 players for team B
        
        // Calculate total MMR for each team including the top players
        let aSum = topPlayer1.mmr; // Team A starts with top player 1
        let bSum = topPlayer2.mmr; // Team B starts with top player 2
        
        remainingTeamA.forEach(c => aSum += c.mmr);
        remainingTeamB.forEach(c => bSum += c.mmr);
        
        const diff = Math.abs(aSum - bSum);
        
        if (diff < bestDiff) {
            bestRemainingA = remainingTeamA;
            bestRemainingB = remainingTeamB;
            bestDiff = diff;
        }
    }
    
    // Combine top players with best remaining players
    teamA = [topPlayer1, ...bestRemainingA];
    teamB = [topPlayer2, ...bestRemainingB];
    
    // Convert to ids format
    let teamAIds: ids[] = [];
    let teamBIds: ids[] = [];
    
    teamA.forEach(c => teamAIds.push({db: c.dbId, discord: c.discordId, region: c.region}));
    teamB.forEach(c => teamBIds.push({db: c.dbId, discord: c.discordId, region: c.region}));
    
    // Log team generation to game-logs channel
    try {
        const channel = await client?.channels.fetch(tokens.GameLogChannel) as TextChannel;
        const embed = new EmbedBuilder();
        embed.setTitle("Testing Top 2 Split Generation)");
        embed.setDescription(`MMR Difference: ${bestDiff}\nTop 2 players split across teams for balance`);
        
        let teamAStr = "";
        let teamBStr = "";
        teamA.forEach(user => teamAStr += `<@${user.discordId}> `);
        teamB.forEach(user => teamBStr += `<@${user.discordId}> `);
        
        embed.addFields(
            { name: "Team A", value: teamAStr, inline: true },
            { name: "Team B", value: teamBStr, inline: true }
        );
        
        await channel.send({embeds: [embed.toJSON()]});
    } catch (e) {
        console.error("Failed to log team generation:", e);
    }
    
    return {teamA: teamAIds, teamB: teamBIds, mmrDiff: bestDiff};
}
