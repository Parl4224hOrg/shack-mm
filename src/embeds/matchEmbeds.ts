import {EmbedBuilder} from "discord.js";
import {GameUser} from "../interfaces/Game";
import tokens from "../tokens";

export const matchConfirmEmbed = (scores: number[]) => {
    const embed = new EmbedBuilder()

    embed.setTitle('Accept Scores')
    embed.setDescription('If these score are incorrect resubmit using the buttons on the initial message that is pinned')
    embed.setFields([
        {
           name: 'Team A',
           value: String(scores[0]),
           inline: true ,
        },{
            name: 'Team B',
            value: String(scores[1]),
            inline: true,
        }
    ])

    return embed.toJSON();
}

export const teamsEmbed = (users: GameUser[], matchNumber: number, queue: string, map: string, sides: string[]) => {
    const embed = new EmbedBuilder()

    let teamA = '';
    let teamB = '';

    for (let user of users) {
        if (user.team == 0) {
            teamA += `<@${user.discordId}>\n`
        } else {
            teamB += `<@${user.discordId}>\n`
        }
    }

        embed.setTitle(`${queue.toUpperCase()}-Match-${matchNumber}: ${map.toUpperCase()}`);
        embed.setFields([
            {
                name: `Team A: ${sides[0]}`,
                value: teamA,
                inline: true,
            },
            {
                name: `Team B: ${sides[1]}`,
                value: teamB,
                inline: true,
            },
        ])

    if (map.toLowerCase() == 'hideout') {
        embed.setImage(tokens.Images.Hideout);
    } else if (map.toLowerCase() == 'skyscraper') {
        embed.setImage(tokens.Images.Skyscraper);
    } else if (map.toLowerCase() == 'factory') {
        embed.setImage(tokens.Images.Factory);
    }

    return embed.toJSON();

}
