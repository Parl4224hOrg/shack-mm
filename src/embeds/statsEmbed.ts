import {StatsInt} from "../database/models/StatsModel";
import {APIEmbed, EmbedBuilder, User} from "discord.js";
import {UserInt} from "../database/models/UserModel";
import {getRank} from "../utility/ranking";
import tokens from "../tokens";
import {WarnInt} from "../database/models/WarnModel";

export const statsEmbed = (stats: StatsInt, user: UserInt, name: string, imageURL: string): APIEmbed => {
    const embed = new EmbedBuilder();



    if (stats.gamesPlayed >= 10) {
        embed.setTitle(`${name}'s Stats - [${stats.rank}]`);
        embed.setDescription(`${getRank(stats.mmr).name}-${stats.mmr.toFixed(1)} MMR\nGames played - ${stats.gamesPlayed}\n
        [Website Stats](https://shackmm.com/players/${user._id}/stats)`);
    } else {
        embed.setTitle(`${name}'s Stats`);
        if (stats.gamesPlayed == 9) {
            embed.setDescription(`Play 1 more game to get ranked\nGames played - ${stats.gamesPlayed}`);
        } else {
            embed.setDescription(`Play ${10 - stats.gamesPlayed} more games to get ranked\nGames played - ${stats.gamesPlayed}`);
        }

    }

    embed.setThumbnail(imageURL);

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

export const warningEmbeds = (user: User, warnings: WarnInt[]): APIEmbed => {
    const embed = new EmbedBuilder();
    embed.setTitle(`Warnings for ${user.username}`);
    if (warnings.length > 25) {
        embed.setDescription(`<@${user.id}>\nThere are ${warnings.length - 25} older warnings not shown`);
        for (let warn of warnings.slice(warnings.length - 25, warnings.length)) {
            if (!warn.removed) {
                const timestamp = "<t:" + warn.timeStamp + ":F>"
                embed.addFields({
                    name: `${warn._id}`,
                    value: `Reason: ${warn.reason}\nDate: ${timestamp}\nMod: <@${warn.modId}>`
                });
            }
        }
    } else {
        embed.setDescription(`<@${user.id}>`);
        for (let warn of warnings) {
            if (!warn.removed) {
                const timestamp = "<t:" + warn.timeStamp + ":F>"
                embed.addFields({
                    name: `${warn._id}`,
                    value: `Reason: ${warn.reason}\nDate: ${timestamp}\nMod: <@${warn.modId}>`
                });
            }
        }
    }

    return embed.toJSON();
}
