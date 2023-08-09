import {Client, GuildMember, User} from "discord.js";
import {LocalGame, QueueUser} from "../interfaces/Game";
import {getUserByUser} from "../modules/getters/getUser";
import {GameData, InternalResponse, QueueData} from "../interfaces/Internal";
import {Data} from "../data";
import moment from "moment";
import {getStats} from "../modules/getters/getStats";
import {grammaticalList} from "../utility/grammatical";
import {ObjectId} from "mongoose";
import {updateUser} from "../modules/updaters/updateUser";

export class SNDController {
    readonly queueId = 'SND'
    readonly queueName: string;
    private data: Data;
    private client: Client;
    private inQueue: QueueUser[] = [];
    private activeGames: LocalGame[] = [];


    constructor(data: Data, client: Client, queueName: string) {
        this.data = data;
        this.client = client;
        this.queueName = queueName;
    }

    async load(){
        // const data = await getSNDController()
    }

    async addUser(discordUser: User | GuildMember, time: number): Promise<InternalResponse> {
        const user = await getUserByUser(discordUser);
        if (user.banUntil > moment().unix()) {
            return {success: false, message: `You are currently banned for another ${0}`}
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
        })
        return {
            success: true,
            message: `You have readied up for ${time} minutes\nThere are ${this.inQueue.length} players in ${this.queueName}`
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
            }
        }
    }

    addGame(game: LocalGame) {
        this.activeGames.push(game);
    }

    getQueueStr() {
        let queueStr = `[${this.queueName}] - ${this.inQueue.length} in Queue:\n`;
        let names = []
        for (let user of this.inQueue) {
            names.push(user.name);
        }
        return queueStr + grammaticalList(names);
    }

    removeUser(userId: ObjectId) {
        this.inQueue.forEach((user, index) => {
            if (String(user.dbId) == String(userId)) this.inQueue.splice(index, 1);
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
}