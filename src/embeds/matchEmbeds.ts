import {
    ContainerBuilder,
    EmbedBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder
} from "discord.js";
import {GameUser, GameUserWithStats} from "../interfaces/Game";
import {GameInt} from "../database/models/GameModel";
import {getUserById} from "../modules/getters/getUser";
import {GameController} from "../controllers/GameController";
import {Data} from "../data";
import {MapInt} from "../database/models/MapModel";

export const matchFinalEmbed = (game: GameInt, users: GameUserWithStats[], mapData: MapInt) => {
    let teamA = '';
    let teamB = '';

    for (let user of users) {
        if (user.team == 0) {
            const index = game.teamA.indexOf(user.dbId);
            const change = index >= 0 ? game.teamAChanges[index] : 0;
            let changeText = change != 0 ? change > 0 ? `Δ+${change.toFixed(2)}` : `Δ${change.toFixed(2)}` : "Δ ??.??";
            teamA += `\n- ${changeText} | <@${user.discordId}> - ${user.kills}/${user.deaths}/${user.assists}`;
        } else {
            const index = game.teamB.indexOf(user.dbId);
            const change = index >= 0 ? game.teamBChanges[index] : 0;
            let changeText = change != 0 ? change > 0 ? `Δ+${change.toFixed(2)}` : `Δ${change.toFixed(2)}` : "Δ ??.??";
            teamB += `\n- ${changeText} | <@${user.discordId}> - ${user.kills}/${user.deaths}/${user.assists}`;
        }
    }

    return new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(`# Match ${game.matchId}: ${mapData.name} ${game.scoreA} - ${game.scoreB}`),
        )
        .addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems(
                new MediaGalleryItemBuilder().setURL(
                    mapData.imageURL,
                ),
            ),
        )
        .addSeparatorComponents(
            new SeparatorBuilder()
                .setDivider(true)
                .setSpacing(SeparatorSpacingSize.Small),
        )
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## Team A - ${game.sides[0]}\n${teamA}`),
        )
        .addSeparatorComponents(
            new SeparatorBuilder()
                .setDivider(true)
                .setSpacing(SeparatorSpacingSize.Large),
        )
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## Team B - ${game.sides[1]}\n${teamB}`),
        );
}

export const matchConfirmEmbed = (scores: number[]) => {
    const embed = new EmbedBuilder()

    embed.setTitle('Accept Scores')
    embed.setDescription('If these score are incorrect resubmit using the buttons on the initial message that is pinned')
    embed.setFields([
        {
            name: 'Team A',
            value: String(scores[0]),
            inline: true,
        }, {
            name: 'Team B',
            value: String(scores[1]),
            inline: true,
        }
    ])

    return embed.toJSON();
}

export const matchScorePrompt = (scores: number[]) => {
    const embed = new EmbedBuilder()

    embed.setTitle('Confirm Server\'s Scores')
    embed.setDescription('If these score are incorrect resubmit using the buttons below')
    embed.setFields([
        {
            name: 'Team A',
            value: String(scores[0]),
            inline: true,
        }, {
            name: 'Team B',
            value: String(scores[1]),
            inline: true,
        }
    ])

    return embed.toJSON();
}

export const teamsEmbed = async (users: GameUser[], matchNumber: number, queue: string, map: MapInt, sides: string[], data: Data) => {
    const embed = new EmbedBuilder()

    let teamA = '';
    let teamB = '';

    for (let user of users) {
        const dbUser = await getUserById(user.dbId, data);
        if (user.team == 0) {
            teamA += `<@${user.discordId}>:${dbUser.oculusName}\n`
        } else {
            teamB += `<@${user.discordId}>:${dbUser.oculusName}\n`
        }
    }

    embed.setTitle(`${queue.toUpperCase()}-Match-${matchNumber}: ${map.name.toUpperCase()}`);
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

    embed.setImage(map.imageURL);

    return embed.toJSON();

}

export const gameEmbed = (game: GameController) => {
    const embed = new EmbedBuilder()
    embed.setTitle(`Match ${game.matchNumber}-${game.map}`);
    embed.setDescription(`Game started <t:${game.startTime}:R>`);
    if (game.state >= 1) {
        let teamA = "";
        let teamB = "";
        for (let user of game.users) {
            if (user.team == 0) {
                teamA += `<@${user.discordId}>\n`;
            } else {
                teamB += `<@${user.discordId}>\n`;
            }
        }
        let teamATitle = `Team A-${game.sides[0]}`;
        let teamBTitle = `Team B-${game.sides[1]}`;
        if (game.gameStarted && game.serverScoreA >= 0 && game.serverScoreB >= 0) {
            teamATitle += ` Rounds: ${game.serverScoreA}`;
            teamBTitle += ` Rounds: ${game.serverScoreB}`;
        }
        embed.addFields({
            name: teamATitle,
            value: teamA,
            inline: true,
        }, {
            name: teamBTitle,
            value: teamB,
            inline: true,
        });
    } else {
        let accepted = "";
        let noAccepted = "";
        const sortedUsers = [...game.users].sort((a, b) => a.discordId.localeCompare(b.discordId));
        for (let user of sortedUsers) {
            if (user.accepted) {
                accepted += `<@${user.discordId}>\n`;
            } else {
                noAccepted += `<@${user.discordId}>\n`;
            }
        }
        embed.addFields({
            name: `Accepted`,
            value: accepted,
            inline: true,
        }, {
            name: `Not Accepted`,
            value: noAccepted,
            inline: true,
        });
    }

    return embed.toJSON();
}
