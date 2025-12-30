import {getUserByUser} from "../modules/getters/getUser";
import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    Client,
    EmbedBuilder, Guild,
    MessageFlagsBitField,
    TextChannel
} from "discord.js";
import {Data} from "../data";
import tokens from "../tokens";
import {logInfo} from "../loggers";
import {MapData} from "../interfaces/Internal";
import mapModel from "../database/models/MapModel";
import {QueueUser} from "../interfaces/Game";
import {Regions} from "../database/models/UserModel";
import * as discordTranscripts from "discord-html-transcripts";

export const registerMaps = (data: Data, maps: string[]) => {
    const mapData = data.getQueue().getMapData();
    const toAdd: string[] = [];
    for (let map of maps) {
        let found = false;
        for (let mapCheck of mapData) {
            if (mapCheck.mapName == map) {
                found = true;
            }
        }
        if (!found) {
            toAdd.push(map);
        }
    }
    for (let map of toAdd) {
        mapData.push({
            mapName: map,
            lastGame: 0,
        })
    }
    mapData.forEach((map, i) => {if (!maps.includes(map.mapName)) mapData.splice(i, 1)})
}

export const getMapsDB = async (limit: number = tokens.VoteSize) => {
    return mapModel.find({active: true}).sort({lastPlayed: 1}).limit(limit);
}

export const getMapData = async (map: string) => {
    return mapModel.findOne({name: map});
}

export const getOrderedMaps = (data: Data, log: boolean = false): MapData[] => {
    const mapData = data.getQueue().getMapData();
    let mapStr = "";
    for (let map of mapData) {
        mapStr += `\n${map.mapName} : ${map.lastGame}`;
    }
    if (log) {
        logInfo(`Maps Pre sort:${mapStr}`, data.getClient());
    }
    // Sort to get least recent first
    mapData.sort((a, b) => a.lastGame - b.lastGame);
    mapStr = "";
    for (let map of mapData) {
        mapStr += `\n${map.mapName} : ${map.lastGame}`;
    }
    if (log) {
        logInfo(`Maps Post sort:${mapStr}`, data.getClient());
    }
    return mapData;
}

export const getMaps = (data: Data) => {
    const mapData = getOrderedMaps(data, true);
    const maps: string[] = [];
    for (let i = 0; i < tokens.VoteSize; i++) {
        maps.push(mapData[i].mapName);
    }
    logInfo(`Selected Maps:\n${maps}`, data.getClient()).then();
    return maps;
}

export const addLastPlayedMap = async (data: Data, map: string, matchNumber: number) => {
    const mapData = data.getQueue().getMapData();
    let found = false;
    for (let mapCheck of mapData) {
        if (mapCheck.mapName == map) {
            mapCheck.lastGame = matchNumber;
            found = true;
        }
    }
    if (!found) {
        mapData.push({mapName: map, lastGame: matchNumber});
    }

    const mapDoc = await mapModel.findOne({name: map});
    if (mapDoc) {
        mapDoc.lastPlayed = matchNumber;
        await mapDoc.save();
    } else {
        await logInfo(`Could not find map ${map} in database`, data.getClient());
    }

}

export const logReady = async (userId: string, queueLabel: string, time: number, client: Client) => {
    const channel = await client.channels.fetch(tokens.QueueLogChannel) as TextChannel;
    const embed = new EmbedBuilder();
    embed.setTitle("User has readied");
    embed.setDescription(`<@${userId}> has readied up in ${queueLabel} for ${time} minutes`);
    await channel.send({embeds: [embed.toJSON()]});
}

export const logUnready = async (userId: string, queueLabel: string, client: Client) => {
    const channel = await client.channels.fetch(tokens.QueueLogChannel) as TextChannel;
    const embed = new EmbedBuilder();
    embed.setTitle("User has unreadied");
    embed.setDescription(`<@${userId}> has unreadied up in ${queueLabel}`);
    await channel.send({embeds: [embed.toJSON()]});
}

export const logAccept = async (userId: string, matchId: number, client: Client) => {
    const channel = await client.channels.fetch(tokens.GameLogChannel) as TextChannel;
    const embed = new EmbedBuilder();
    embed.setTitle("User has accepted");
    embed.setDescription(`<@${userId}> has accepted match ${matchId}`);
    await channel.send({embeds: [embed.toJSON()]});
}

export const logScoreSubmit = async (userId: string, matchId: number, score: number, client: Client) => {
    const channel = await client.channels.fetch(tokens.GameLogChannel) as TextChannel;
    const embed = new EmbedBuilder();
    embed.setTitle("User has Submitted a score");
    embed.setDescription(`<@${userId}> has submitted a score of ${score} for match ${matchId}`);
    await channel.send({embeds: [embed.toJSON()]});
}

export const logScoreAccept = async (userId: string, matchId: number, team: string, client: Client) => {
    try {
        const channel = await client.channels.fetch(tokens.GameLogChannel) as TextChannel;
        const embed = new EmbedBuilder();
        embed.setTitle("User has Accepted Scores");
        embed.setDescription(`<@${userId}> has accepted scores for ${team} in match ${matchId}`);
        await channel.send({embeds: [embed.toJSON()]});
    } catch (e) {
        console.error("Failed to log score acceptance to channel:", e);
    }
}


export const matchVotes = async (interaction: ButtonInteraction, data: Data) => {
    const dbUser = await getUserByUser(interaction.user, data);
    const controller = data.findController();
    if (controller) {
        const game = controller.findGame(dbUser._id);
        if (game) {
            const response = await game.vote(dbUser._id, interaction.customId as any);
            let isMuted = false;
            let displayName = interaction.user.username;
            try {
                const member = await interaction.guild?.members.fetch(interaction.user.id);
                if (member && member.roles.cache.has(tokens.MutedRole)) {
                    isMuted = true;
                    displayName = member.displayName || member.user.username;
                }
            } catch (e) {
                // If we can't fetch the member, default to ephemeral
                isMuted = false;
            }
            if (isMuted) {
                await interaction.reply({content: `${displayName} (muted): ${response.message}`});
            } else {
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: response.message});
            }
        } else {
            await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "Could not find game please contact a mod"});
        }
    } else {
        await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "Could not find controller please contact a mod"});
    }
}

export const matchReady = async (interaction: ButtonInteraction | ChatInputCommandInteraction, data: Data, queueId: string, queue: string, time: number)=> {
    const response = await data.ready(queueId, queue, interaction.user, time);
    await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: response.message});
}

export const matchUnready = async (interaction: ButtonInteraction | ChatInputCommandInteraction, data: Data, queueId: string) => {
    const dbUser = await getUserByUser(interaction.user, data);
    data.removeFromQueue(dbUser._id, queueId);
    await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: `You have unreadied from ${queueId} queues`})
}

export const matchScore = async (interaction: ButtonInteraction, data: Data, score: number)=> {
    const dbUser = await getUserByUser(interaction.user, data);
    const controller = data.findController();
    if (controller) {
        const game = controller.findGame(dbUser._id);
        if (game) {
            const response = await game.submitScore(dbUser._id, score, interaction.user.id);
            await interaction.reply({content: response.message});
        } else {
            await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "Could not find game please contact a mod"});
        }
    } else {
        await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "Could not find controller please contact a mod"});
    }
}

/**
 * Gets the valid servers for a given set of users
 * @param users users that are in the game
 * @returns Regions where the array is the best server to play in followed by the next best.
 */
export const getServerRegion = (users: QueueUser[]): Regions[] => {
    let APAC = 0;
    let NAW = 0;
    let NAE = 0;
    let EU = 0;
    for (let user of users) {
        switch (user.region) {
            case Regions.NAE:
                NAW++; break;
            case Regions.NAW:
                NAE++; break;
            case Regions.EUW:
            case Regions.EUE:
                EU++; break;
            case Regions.APAC: APAC++; break;
        }
    }

    if (APAC > 0 && EU > 0) {
        return [Regions.NAC];
    } else if (APAC > 0) {
        return [Regions.NAC, Regions.NAW];
    } else if (EU > 0) {
        return [Regions.NAE, Regions.NAC];
    } else if (NAW > NAE) {
        return [Regions.NAC, Regions.NAW, Regions.NAE];
    }
    return [Regions.NAC, Regions.NAE, Regions.NAW];
}

export const handleChannelLog = async (id: string, guild: Guild) => {
    const channel = await guild.channels.fetch(id) as TextChannel;
    if (!channel) {
        return;
    }

    const attachment = await discordTranscripts.createTranscript(channel);

    const logChannel = await guild.channels.fetch(tokens.GameLogChannel) as TextChannel;
    if (!logChannel) {
        return;
    }
    await logChannel.send({
        files: [attachment]
    });

    await channel.delete();
}
