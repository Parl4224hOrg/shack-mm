import {QueueData} from "../interfaces/Internal";
import {APIEmbed, EmbedBuilder} from 'discord.js';

export const queueInfoEmbeds = (queueData: QueueData[]): APIEmbed[] => {
    let embeds: APIEmbed[] = [];
    for (let queue of queueData) {
        let games: APIEmbed[] = [];
        const initialEmbed = new EmbedBuilder()
            .setTitle(queue.queueName)
            .setDescription(`Active Games: ${queue.games.length}\nPlayers in Queue: ${queue.inQueue.length}`);
        let gamesStr = '';
        for (let game of queue.games) {
            const embed = new EmbedBuilder()
                .setTitle(`Match number ${game.matchNumber} (${game.id})`)
                .setDescription(`Map: ${game.map}\nSides: ${game.sides[0]}, ${game.sides[1]}\nState: ${game.state}\nTick count: ${game.tickCount}\n
                Scores: ${game.score[0]}, ${game.score[1]}\nNumber in game: ${game.users.length}`);
            let usersStr = '';
            for (let user of game.users) {
                usersStr += user + "\n";
            }
            gamesStr += `${game.id}\n`;
            embed.addFields({
                name: "Players",
                value: usersStr,
                inline: false,
            });
            games.push(embed.toJSON());
        }
        initialEmbed.addFields({
            name: 'Games',
            value: (gamesStr == '') ? 'none' : gamesStr,
            inline: false,
        });
        embeds.push(initialEmbed.toJSON());
        for (let embed of games) {
            embeds.push(embed);
        }
    }

    return embeds;
}