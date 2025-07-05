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
    
    return {teamA: teamA, teamB: teamB, mmrDiff: bestDiff};
}
