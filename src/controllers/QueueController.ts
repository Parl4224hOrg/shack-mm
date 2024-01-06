import {Client, Collection, TextChannel} from "discord.js";
import {QueueUser} from "../interfaces/Game";
import {GameData, InternalResponse, QueueData} from "../interfaces/Internal";
import {Data} from "../data";
import moment from "moment";
import {getStats} from "../modules/getters/getStats";
import {grammaticalList, grammaticalTime} from "../utility/grammatical";
import {ObjectId} from "mongoose";
import {GameController} from "./GameController";
import {UserInt} from "../database/models/UserModel";
import tokens from "../tokens";
import {QueueControllerInt} from "../database/models/QueueControllerModel";
import {getGameControllerById} from "../modules/getters/getGameController";
import {GameControllerInt} from "../database/models/GameControllerModel";
import {logWarn} from "../loggers";
import {updateUser} from "../modules/updaters/updateUser";
import {logReady, logUnready} from "../utility/match";
import {getUserById} from "../modules/getters/getUser";
import {shuffleArray} from "../utility/makeTeams";

interface PingMeUser {
    id: string;
    inQueue: number;
    expires: number;
    pinged: boolean;
}


const removeDuplicates = (array: QueueUser[]) => {
    const newArr: QueueUser[] = [];
    for (let value of array) {
        let inNew = false;
        for (let newValue of newArr) {
            if (newValue.discordId == value.discordId) {
                inNew = true;
                break;
            }
        }
        if (!inNew) {
            newArr.push(value);
        }
    }
    return newArr;
}

export class QueueController {
    readonly queueId = 'SND'
    readonly queueName: string;
    private readonly data: Data;
    private readonly client: Client;
    private inQueue: QueueUser[] = [];
    private pingMe = new Collection<string, PingMeUser>()
    activeGames: GameController[] = [];
    lastPlayedMaps: string[] = [];
    generating = false;


    constructor(data: Data, client: Client, queueName: string) {
        this.data = data;
        this.client = client;
        this.queueName = queueName;
    }

    setInQueue(users: QueueUser[]) {
        console.log("here6");
        this.inQueue = users.concat(this.inQueue);
        console.log("here7");
    }

    async load(data: QueueControllerInt){
        try {
            this.inQueue = data.inQueue;
            const guild = await this.client.guilds.fetch(tokens.GuildID)
            for (let game of data.activeGames) {
                const gameNew = new GameController(game, this.client, guild, -1, [], [], this.queueId, -10, this.lastPlayedMaps, this.data)
                const dbGame = await getGameControllerById(game)
                await gameNew.load(dbGame as GameControllerInt);
            }
        } catch (e) {
            await logWarn("Couldn't load data", this.client);
        }
    }

    async addPingMe(userId: string, inQueue: number, expire_time: number) {
        if (expire_time < 0) {
            this.pingMe.set(userId, {
                id: userId,
                inQueue: inQueue,
                expires: -1,
                pinged: false,
            });
        } else if (expire_time == 0) {
            this.pingMe.delete(userId);
        } else {
            this.pingMe.set(userId, {
                id: userId,
                inQueue: inQueue,
                expires: moment().unix() + expire_time * 60,
                pinged: false,
            });
        }

    }

    async addUser(user: UserInt, time: number): Promise<InternalResponse> {
        if (user.banUntil > moment().unix()) {
            return {success: false, message: `You are currently banned for another ${grammaticalTime(user.banUntil - moment().unix())}`};
        }
        if (this.data.inGame(user._id)) {
            return {success: false, message: `You are currently in a game`};
        }
        if (this.generating) {
            return {success: false, message: "Please try again in a couple seconds"};
        }
        if (user.frozen == null) {
            user.frozen = false;
            await updateUser(user);
        }
        if (user.frozen) {
            return {success: false, message: "You cannot queue as you have a pending ticket please go resolve it in order to queue"}
        }
        this.removeUser(user._id, true);
        const stats = await getStats(user._id, this.queueId);
        this.inQueue.push({
            dbId: user._id,
            discordId: user.id,
            queueExpire: moment().unix() + time * 60,
            mmr: stats.mmr,
            name: user.name,
            region: user.region,
        });
        const channel = await this.client.channels.fetch(tokens.SNDChannel) as TextChannel;
        await channel.send(`${user.name} has readied up for ${time} minutes`);
        await logReady(user.id, `${this.queueId}`, time, this.client);
        return {
            success: true,
            message: `You have readied up for ${time} minutes\nThere are ${this.inQueue.length} players in ${this.queueId}`
        }
    }

    async tick() {
        this.inQueue = removeDuplicates(this.inQueue);
        const time = moment().unix()
        const guild = this.client.guilds.cache.get(tokens.GuildID)!
        for (let user of this.inQueue) {
            if (user.queueExpire < time) {
                this.removeUser(user.dbId, true);
            } else if (user.queueExpire == (time + 180)) {
                const member = await guild.members.fetch(user.discordId);
                if (!member.dmChannel) {
                    await member.createDM(true);
                }
                const dbUser = await getUserById(user.dbId);
                if (dbUser.dmQueue) {
                    await member.dmChannel!.send("Your queue time expires in 3 minutes. If you wish to re ready please do so");
                }
            }
        }
        for (let game of this.activeGames) {
            await game.tick();
            if (game.isProcessed()) {
                if (game.abandoned) {
                    await game.abandonCleanup(false);
                } else {
                    await game.cleanup();
                }
                this.activeGames.forEach((gameItr, i) => {if (String(gameItr.id) == String(game.id)) this.activeGames.splice(i, 1)});
                while (this.lastPlayedMaps.length > tokens.MapPool.length - 7) {
                    this.lastPlayedMaps.shift();
                }
                this.lastPlayedMaps.push(game.map);
                shuffleArray(game.requeueArray);
                for (let user of game.requeueArray) {
                    const dbUser = await getUserById(user);
                    const member = await guild.members.fetch(dbUser.id);
                    await this.addUser(dbUser, 15);
                    if (!member.dmChannel) {
                        await member.createDM(true);
                    }
                    if (dbUser.dmAuto) {
                        await member.dmChannel!.send("You have been readied for 15 minutes automatically");
                    }
                }
            }
        }
        const queueChannel = await guild.channels.fetch(tokens.SNDChannel) as TextChannel;
        for (let user of this.pingMe.values()) {
            if (this.inQueueNumber() >= user.inQueue && !user.pinged) {
                await queueChannel.send(`<@${user.id}> there are in ${user.inQueue} queue`);
                user.pinged = true;
            }
            if (time > user.expires && user.expires >= 0) {
                this.pingMe.delete(user.id);
            }
            if (this.inQueueNumber() < user.inQueue) {
                user.pinged = false;
            }
        }
    }

    addGame(game: GameController) {
        this.activeGames.push(game);
        this.generating = false;
    }

    getQueueStr() {
        let queueStr = `[**${this.queueId}**] - ${this.inQueue.length} in Queue:\n`;
        let names = []
        for (let user of this.inQueue) {
            names.push(user.name);
        }
        return queueStr + grammaticalList(names);
    }

    removeUser(userId: ObjectId, noMessage: boolean) {
        this.inQueue.forEach( async (user, index) => {
            if (String(user.dbId) == String(userId)) {
                this.inQueue.splice(index, 1);
                const channel = await this.client.channels.fetch(tokens.SNDChannel) as TextChannel;
                if (!noMessage) {
                    await channel.send(`${user.name} has unreadied`);
                }
                await logUnready(user.discordId, this.queueId, this.client);
            }
        });
    }

    inGame(userId: ObjectId): boolean {
        for (let game of this.activeGames) {
            if (!game.abandoned) {
                for (let user of game.getUsers()) {
                    if (String(user.dbId) == String(userId)) {
                        return true;
                    }
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
            if (!game.abandoned) {
                for (let user of game.getUsers()) {
                    if (String(user.dbId) == String(id)) {
                        return game;
                    }
                }
            }
        }
    }

    async acceptGame(id: ObjectId): Promise<InternalResponse> {
        const game = this.findGame(id);
        if (game) {
            await game.userAccept(id);
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