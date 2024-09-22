import {getUserByUser} from "../modules/getters/getUser";
import {ButtonInteraction, ChatInputCommandInteraction, Client, EmbedBuilder, TextChannel} from "discord.js";
import {Data} from "../data";
import tokens from "../tokens";
import {logInfo} from "../loggers";

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

export const getMaps = (data: Data) => {
    const maps: string[] = [];
    const mapData = data.getQueue().getMapData();
    let mapStr = "";
    for (let map of mapData) {
        mapStr += `\n${map.mapName} : ${map.lastGame}`;
    }
    logInfo(`Maps Pre sort:${mapStr}`, data.getClient());
    // Sort to get least recent first
    mapData.sort((a, b) => a.lastGame - b.lastGame);
    mapStr = "";
    for (let map of mapData) {
        mapStr += `\n${map.mapName} : ${map.lastGame}`;
    }
    logInfo(`Maps Post sort:${mapStr}`, data.getClient());
    for (let i = 0; i < tokens.VoteSize; i++) {
        maps.push(mapData[i].mapName);
    }
    logInfo(`Selected Maps:\n${maps}`, data.getClient());
    return maps;
}

export const addLastPlayedMap = (data: Data, map: string, matchNumber: number) => {
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


export const matchVotes = async (interaction: ButtonInteraction, data: Data) => {
    const dbUser = await getUserByUser(interaction.user, data);
    const controller = data.findController();
    if (controller) {
        const game = controller.findGame(dbUser._id);
        if (game) {
            const response = await game.vote(dbUser._id, interaction.customId as any);
            await interaction.reply({ephemeral: true, content: response.message});
        } else {
            await interaction.reply({ephemeral: true, content: "Could not find game please contact a mod"});
        }
    } else {
        await interaction.reply({ephemeral: true, content: "Could not find controller please contact a mod"});
    }
}

export const matchReady = async (interaction: ButtonInteraction | ChatInputCommandInteraction, data: Data, queueId: string, queue: string, time: number)=> {
    const response = await data.ready(queueId, queue, interaction.user, time);
    await interaction.reply({ephemeral: true, content: response.message});
}

export const matchUnready = async (interaction: ButtonInteraction | ChatInputCommandInteraction, data: Data, queueId: string) => {
    const dbUser = await getUserByUser(interaction.user, data);
    data.removeFromQueue(dbUser._id, queueId);
    await interaction.reply({ephemeral: true, content: `You have unreadied from ${queueId} queues`})
}

export const matchScore = async (interaction: ButtonInteraction, data: Data, score: number)=> {
    const dbUser = await getUserByUser(interaction.user, data);
    const controller = data.findController();
    if (controller) {
        const game = controller.findGame(dbUser._id);
        if (game) {
            const response = await game.submitScore(dbUser._id, score, interaction.user.id);
            await interaction.reply({ephemeral: false, content: response.message});
        } else {
            await interaction.reply({ephemeral: true, content: "Could not find game please contact a mod"});
        }
    } else {
        await interaction.reply({ephemeral: true, content: "Could not find controller please contact a mod"});
    }
}
