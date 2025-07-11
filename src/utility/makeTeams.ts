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
    let bottomTwoSplitDiff = 0;
    try {
        const bottomTwoResult = await makeTeamsSplittingBottomTwoPlayers(users, client);
        bottomTwoSplitDiff = bottomTwoResult.mmrDiff;
    } catch (e) {
        console.error("Failed to call makeTeamsSplittingBottomTwoPlayers:", e);
    }
    
    // Log the comparison
    try {
        const channel = await client?.channels.fetch(tokens.GameLogChannel) as TextChannel;
        const embed = new EmbedBuilder();
        embed.setTitle("Team Generation Comparison");
        embed.setDescription(`makeTeams got a MMRDiff of ${bestDiff}, splitting the bottom 2 players got a MMRDiff of ${bottomTwoSplitDiff}, with a difference of ${Math.abs(bestDiff - bottomTwoSplitDiff)}`);
        embed.setColor(bestDiff < bottomTwoSplitDiff ? 0x00FF00 : 0xFF0000); // Green if original is better, red if bottom2 split is better
        
        await channel.send({embeds: [embed.toJSON()]});
    } catch (e) {
        console.error("Failed to log comparison:", e);
    }
    
    return {teamA: teamA, teamB: teamB, mmrDiff: bestDiff};
}

export const makeTeamsSplittingBottomTwoPlayers = async (users: QueueUser[], client?: Client): Promise<{teamA: ids[], teamB: ids[], mmrDiff: number}> => {
    // Sort users by MMR (ELO) in ascending order (lowest first)
    const sortedUsers = [...users].sort((a, b) => a.mmr - b.mmr);
    
    // Get the bottom 2 players
    const bottomPlayer1 = sortedUsers[0]; // Lowest player
    const bottomPlayer2 = sortedUsers[1]; // Second lowest player
    
    // Get the remaining 8 players
    const remainingPlayers = sortedUsers.slice(2);
    
    // Try both ways to split the bottom 2 players
    const splits = [
        { teamA: [bottomPlayer1], teamB: [bottomPlayer2] },
        { teamA: [bottomPlayer2], teamB: [bottomPlayer1] }
    ];
    
    let bestDiff = 9999;
    let bestA: QueueUser[] = [];
    let bestB: QueueUser[] = [];
    
    for (const split of splits) {
        // Permutation logic (same as makeTeams)
        let length = remainingPlayers.length,
            permutations = [remainingPlayers.slice()],
            c = new Array(length).fill(0),
            i = 1, k, p;
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
        for (let permutation of permutations) {
            let teamA = [...split.teamA, ...permutation.slice(0, 4)];
            let teamB = [...split.teamB, ...permutation.slice(4, 8)];
            let aSum = 0;
            let bSum = 0;
            teamA.forEach(c => aSum += c.mmr);
            teamB.forEach(c => bSum += c.mmr);
            const diff = Math.abs(aSum - bSum);
            if (diff < bestDiff) {
                bestA = teamA;
                bestB = teamB;
                bestDiff = diff;
            }
        }
    }
    // Convert to ids format
    let teamAIds: ids[] = [];
    let teamBIds: ids[] = [];
    bestA.forEach(c => teamAIds.push({db: c.dbId, discord: c.discordId, region: c.region}));
    bestB.forEach(c => teamBIds.push({db: c.dbId, discord: c.discordId, region: c.region}));
    // Log team generation to game-logs channel
    try {
        const channel = await client?.channels.fetch(tokens.GameLogChannel) as TextChannel;
        const embed = new EmbedBuilder();
        embed.setTitle("Testing Bottom 2 Split Generation");
        embed.setDescription(`MMR Difference: ${bestDiff}\nBottom 2 players split across teams for balance`);
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
    return {teamA: teamAIds, teamB: teamBIds, mmrDiff: bestDiff};
}
