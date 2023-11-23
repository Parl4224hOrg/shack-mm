import {Client, TextChannel} from "discord.js";
import {QueueUser} from "../interfaces/Game";
import {GameData, InternalResponse, QueueData} from "../interfaces/Internal";
import {Data} from "../data";
import moment from "moment";
import {getStats} from "../modules/getters/getStats";
import {grammaticalList, grammaticalTime} from "../utility/grammatical";
import {ObjectId} from "mongoose";
import {updateUser} from "../modules/updaters/updateUser";
import {GameController} from "./GameController";
import {UserInt} from "../database/models/UserModel";
import tokens from "../tokens";
import {QueueControllerInt} from "../database/models/QueueControllerModel";
import {getGameControllerById} from "../modules/getters/getGameController";
import {GameControllerInt} from "../database/models/GameControllerModel";

export class QueueController {
    readonly queueId = 'SND'
    readonly queueName: string;
    private data: Data;
    private readonly client: Client;
    private inQueue: QueueUser[] = [];
    activeGames: GameController[] = [];


    constructor(data: Data, client: Client, queueName: string) {
        this.data = data;
        this.client = client;
        this.queueName = queueName;
    }

    async load(data: QueueControllerInt){
        this.inQueue = data.inQueue;
        const guild = await this.client.guilds.fetch(tokens.GuildID)
        for (let game of data.activeGames) {
            const gameNew = new GameController(game, this.client, guild, -1, [], [], this.queueId, -10)
            const dbGame = await getGameControllerById(game)
            await gameNew.load(dbGame as GameControllerInt);
        }
    }

    async addUser(user: UserInt, time: number): Promise<InternalResponse> {
        if (user.banUntil > moment().unix()) {
            return {success: false, message: `You are currently banned for another ${grammaticalTime(user.banUntil - moment().unix())}`}
        }
        if (this.data.inGame(user._id)) {
            return {success: false, message: `You are currently in a game`}
        }
        this.removeUser(user._id);
        const stats = await getStats(user._id, this.queueId);
        user.stats.push(stats._id);
        await updateUser(user);
        this.inQueue.push({
            dbId: user._id,
            discordId: user.id,
            queueExpire: moment().unix() + time * 60,
            mmr: stats.mmr,
            name: user.name,
        });
        const channel = await this.client.channels.fetch(tokens.SNDChannel) as TextChannel;
        await channel.send(`${user.name} has readied up for ${time} minutes`);
        return {
            success: true,
            message: `You have readied up for ${time} minutes\nThere are ${this.inQueue.length} players in ${this.queueId}`
        }
    }

    async tick() {
        const time = moment().unix()
        for (let user of this.inQueue) {
            if (user.queueExpire < time) {
                this.removeUser(user.dbId);
            }
        }
        for (let game of this.activeGames) {
            await game.tick();
            if (game.isProcessed()) {
                await game.cleanup();
                this.activeGames.forEach((gameItr, i) => {if (String(gameItr.id) == String(game.id)) this.activeGames.splice(i, 1)});
                await game.sendScoreEmbed();
            }
        }
    }

    addGame(game: GameController) {
        this.activeGames.push(game);
    }

    getQueueStr() {
        let queueStr = `[**${this.queueId}**] - ${this.inQueue.length} in Queue:\n`;
        let names = []
        for (let user of this.inQueue) {
            names.push(user.name);
        }
        return queueStr + grammaticalList(names);
    }

    removeUser(userId: ObjectId) {
        this.inQueue.forEach( async (user, index) => {
            if (String(user.dbId) == String(userId)) {
                this.inQueue.splice(index, 1);
                const channel = await this.client.channels.fetch(tokens.SNDChannel) as TextChannel;
                await channel.send(`${user.name} has unreadied`);
            }
        });
    }

    inGame(userId: ObjectId): boolean {
        for (let game of this.activeGames) {
            for (let user of game.getUsers()) {
                if (String(user.dbId) == String(userId)) {
                    return true;
                }
            }
        }
        return false
    }

    getGame(userId: ObjectId) {
        for (let game of this.activeGames) {
            for (let user of game.getUsers()) {
                if (String(user.dbId) == String(userId)) {
                    return game;
                }
            }
        }
        return null
    }

    findGame(id: ObjectId) {
        for (let game of this.activeGames) {
            for (let user of game.getUsers()) {
                if (String(user.dbId) == String(id)) {
                    return game;
                }
            }
        }
    }

    acceptGame(id: ObjectId): InternalResponse {
        const game = this.findGame(id);
        if (game) {
            game.userAccept(id);
            return {success: true, message: "You have accepted your game"}
        } else {
            return {success: false, message: "Could not find game please contact a mod"}
        }
    }

    inQueueNumber() {
        return this.inQueue.length;
    }

    getUser() {
        const user = this.inQueue[0];
        this.inQueue.splice(0, 1);
        return user
    }

    clearQueue() {
        this.inQueue = [];
    }

    getInfo(): QueueData {
        let gameData: GameData[] = [];
        for (let game of this.activeGames) {
            gameData.push(game.getInfo());
        }
        let userData: string[] = []
        for (let user of this.inQueue) {
            userData.push(`<@${user.discordId}>`)
        }
        return {
            queueName: this.queueName,
            inQueue: userData,
            games: gameData,
        }
    }

    getMissing(userId: ObjectId) {
        const game = this.findGame(userId)!;
        return game.getMissing();
    }

    getGameByChannel(id: string) {
        for (let game of this.activeGames) {
            if (game.hasChannel(id)) {
                return game;
            }
        }
        return null;
    }

    getInQueue() {
        return this.inQueue
    }
}