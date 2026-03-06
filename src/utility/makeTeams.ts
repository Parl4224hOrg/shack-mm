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

    try {
        await makeTeamsWithDuos(users, client);
    } catch (e) {
        console.error("Failed to call makeTeamsWithDuos:", e);
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

export const makeTeamsWithDuos = async (users: QueueUser[], client?: Client): Promise<{teamA: ids[], teamB: ids[], mmrDiff: number}> => {
    type Group = {
        users: QueueUser[];
        size: number;
        mmrSum: number;
    };

    const playerToId = (player: QueueUser): ids => ({
        db: player.dbId,
        discord: player.discordId,
        region: player.region
    });

    const findBestTeams = (
        groups: Group[],
        teamSize: number,
        fixedA: QueueUser[] = [],
        fixedB: QueueUser[] = []
    ): {teamA: QueueUser[], teamB: QueueUser[], mmrDiff: number} | null => {
        const remainingSizes = new Array(groups.length + 1).fill(0);
        for (let idx = groups.length - 1; idx >= 0; idx--) {
            remainingSizes[idx] = remainingSizes[idx + 1] + groups[idx].size;
        }

        let best: {teamA: QueueUser[], teamB: QueueUser[], mmrDiff: number} | null = null;

        const recurse = (
            index: number,
            teamA: QueueUser[],
            teamB: QueueUser[],
            sizeA: number,
            sizeB: number,
            sumA: number,
            sumB: number
        ) => {
            if (sizeA > teamSize || sizeB > teamSize) {
                return;
            }

            const remaining = remainingSizes[index];
            if (sizeA + remaining < teamSize || sizeB + remaining < teamSize) {
                return;
            }

            if (index == groups.length) {
                if (sizeA !== teamSize || sizeB !== teamSize) {
                    return;
                }
                const diff = Math.abs(sumA - sumB);
                if (!best || diff < best.mmrDiff) {
                    best = {
                        teamA: [...teamA],
                        teamB: [...teamB],
                        mmrDiff: diff
                    };
                }
                return;
            }

            const group = groups[index];

            teamA.push(...group.users);
            recurse(
                index + 1,
                teamA,
                teamB,
                sizeA + group.size,
                sizeB,
                sumA + group.mmrSum,
                sumB
            );
            teamA.splice(teamA.length - group.size, group.size);

            teamB.push(...group.users);
            recurse(
                index + 1,
                teamA,
                teamB,
                sizeA,
                sizeB + group.size,
                sumA,
                sumB + group.mmrSum
            );
            teamB.splice(teamB.length - group.size, group.size);
        };

        const fixedASize = fixedA.length;
        const fixedBSize = fixedB.length;
        const fixedASum = fixedA.reduce((sum, player) => sum + player.mmr, 0);
        const fixedBSum = fixedB.reduce((sum, player) => sum + player.mmr, 0);

        recurse(0, [...fixedA], [...fixedB], fixedASize, fixedBSize, fixedASum, fixedBSum);
        return best;
    };

    const userById = new Map<string, QueueUser>();
    for (const user of users) {
        userById.set(user.dbId.toString(), user);
    }

    const usedInDuo = new Set<string>();
    const duoGroups: Group[] = [];
    const soloGroups: Group[] = [];

    for (const user of users) {
        const userId = user.dbId.toString();
        if (usedInDuo.has(userId)) {
            continue;
        }

        const duoId = user.duoId?.toString();
        if (!duoId) {
            continue;
        }

        const partner = userById.get(duoId);
        if (!partner) {
            continue;
        }

        const partnerId = partner.dbId.toString();
        if (partnerId == userId || usedInDuo.has(partnerId)) {
            continue;
        }

        const partnerDuoId = partner.duoId?.toString() || "";
        const isMutual = partnerDuoId == userId;
        const withinRange = Math.abs(user.mmr - partner.mmr) <= 100;

        if (!isMutual || !withinRange) {
            continue;
        }

        usedInDuo.add(userId);
        usedInDuo.add(partnerId);
        duoGroups.push({
            users: [user, partner],
            size: 2,
            mmrSum: user.mmr + partner.mmr
        });
    }

    for (const user of users) {
        const userId = user.dbId.toString();
        if (!usedInDuo.has(userId)) {
            soloGroups.push({
                users: [user],
                size: 1,
                mmrSum: user.mmr
            });
        }
    }

    const teamSize = tokens.PlayerCount / 2;
    let bestResult: {teamA: QueueUser[], teamB: QueueUser[], mmrDiff: number} | null = null;

    const isAllDuos = duoGroups.length == 5 && soloGroups.length == 0 && users.length == 10;
    if (isAllDuos) {
        for (let i = 0; i < duoGroups.length; i++) {
            const splitDuo = duoGroups[i];
            const remainingGroups = duoGroups.filter((_, index) => index !== i);
            const [first, second] = splitDuo.users;

            const optionA = findBestTeams(remainingGroups, teamSize, [first], [second]);
            if (optionA && (!bestResult || optionA.mmrDiff < bestResult.mmrDiff)) {
                bestResult = optionA;
            }

            const optionB = findBestTeams(remainingGroups, teamSize, [second], [first]);
            if (optionB && (!bestResult || optionB.mmrDiff < bestResult.mmrDiff)) {
                bestResult = optionB;
            }
        }
    } else {
        bestResult = findBestTeams([...duoGroups, ...soloGroups], teamSize);
    }

    if (!bestResult) {
        if (client) {
            const channel = await client.channels.fetch(tokens.GameLogChannel) as TextChannel;
            await channel.send("No teams found with duos.");
        }
        return {teamA: [], teamB: [], mmrDiff: 0};
    }

    const teamA = bestResult.teamA.map(playerToId);
    const teamB = bestResult.teamB.map(playerToId);

    if (client) {
        try {
            const channel = await client.channels.fetch(tokens.GameLogChannel) as TextChannel;
            const embed = new EmbedBuilder();
            embed.setTitle("Teams Generated With Duos");
            embed.setDescription(`MMR Difference: ${bestResult.mmrDiff}`);

            let teamAStr = "";
            let teamBStr = "";
            bestResult.teamA.forEach(user => teamAStr += `<@${user.discordId}> `);
            bestResult.teamB.forEach(user => teamBStr += `<@${user.discordId}> `);

            embed.addFields(
                {name: "Team A", value: teamAStr || "N/A", inline: true},
                {name: "Team B", value: teamBStr || "N/A", inline: true}
            );

            for (const group of duoGroups) {
                const duoStr = group.users.map(user => `<@${user.discordId}>`).join(", ");
                embed.addFields({name: "Duo", value: duoStr, inline: false});
            }

            await channel.send({embeds: [embed.toJSON()]});
        } catch (e) {
            console.error("Failed to log duo team generation:", e);
        }
    }

    return {teamA, teamB, mmrDiff: bestResult.mmrDiff};
};

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
