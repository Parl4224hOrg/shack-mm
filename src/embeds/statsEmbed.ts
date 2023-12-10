import {StatsInt} from "../database/models/StatsModel";
import {APIEmbed, EmbedBuilder} from "discord.js";
import {UserInt} from "../database/models/UserModel";
import {getRank} from "../utility/ranking";
import tokens from "../tokens";

export const statsEmbed = (stats: StatsInt, user: UserInt, name: string): APIEmbed => {
    const embed = new EmbedBuilder();

    embed.setTitle(`${name}'s Stats`);

    if (stats.gamesPlayed >= 10) {
        embed.setDescription(`${getRank(stats.mmr).name}-${stats.mmr.toFixed(0)}mmr\nGames played - ${stats.gamesPlayed}`);
    } else {
        if (stats.gamesPlayed == 9) {
            embed.setDescription(`Play 1 more game to get ranked\nGames played - ${stats.gamesPlayed}`);
        } else {
            embed.setDescription(`Play ${10 - stats.gamesPlayed} more games to get ranked\nGames played - ${stats.gamesPlayed}`);
        }

    }

    let history = ""
    let games;
    if (stats.gameHistory.length < 10) {
        games = stats.gameHistory.slice(-stats.gameHistory.length);
    } else {
        games = stats.gameHistory.slice(-10)
    }


    for (let game of games) {
        if (game == 'win') {
            history += (tokens.WinEmoji);
        } else if (game == 'loss') {
            history += (tokens.LossEmoji);
        } else {
            history += (tokens.DrawEmoji);
        }
    }

    if (history.length == 0) {
        history = "Play a game to show"
    }


    embed.addFields({
            name: 'Win %',
            value: `${(stats.winRate * 100).toFixed(1)}`,
            inline: true,
        },{
            name: 'Wins',
            value: `${stats.wins}`,
            inline: true,
        },{
            name: 'Losses',
            value: `${stats.losses}`,
            inline: true,
        },{
            name: 'Draws',
            value: `${stats.draws}`,
            inline: true,
        },{
            name: 'History',
            value: history,
            inline: false,
        }
    )

    return embed.toJSON();
}