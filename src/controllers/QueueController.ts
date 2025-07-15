import {Client, Collection, TextChannel} from "discord.js";
import {QueueUser} from "../interfaces/Game";
import {GameData, InternalResponse, MapData, PingMeUser, QueueData} from "../interfaces/Internal";
import {Data} from "../data";
import moment from "moment";
import {getStats} from "../modules/getters/getStats";
import {grammaticalList, grammaticalTime} from "../utility/grammatical";
import mongoose, {ObjectId} from "mongoose";
import {GameController} from "./GameController";
import {UserInt} from "../database/models/UserModel";
import tokens from "../tokens";
import {updateUser} from "../modules/updaters/updateUser";
import {addLastPlayedMap, logReady, logUnready} from "../utility/match";
import {getUserById} from "../modules/getters/getUser";
import {shuffleArray} from "../utility/makeTeams";
import {logWarn} from "../loggers";
import {Regions} from "../database/models/UserModel";
import {logInfo} from "../loggers";


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
    public inQueue: QueueUser[] = [];
    public pingMe = new Collection<string, PingMeUser>()
    activeGames: GameController[] = [];
    generating = false;
    activeAutoQueue = false;
    public mapData: MapData[] = [];


    constructor(data: Data, client: Client, queueName: string) {
        this.data = data;
        this.client = client;
        this.queueName = queueName;
    }

    setInQueue(users: QueueUser[]) {
        this.inQueue = users.concat(this.inQueue);
    }

    public getMapData() {
        return this.mapData;
    }

    async load(data: string) {
        const parsed = JSON.parse(data);
        this.inQueue = parsed.inQueue;
        for (let ping of parsed.pingMe) {
            this.pingMe.set(ping.id, ping);
        }
        for (let game of parsed.activeGames) {
            let server = null;
            if (game.server) {
                server = this.data.getServer(game.server.name ?? "none");
            }
            const newGame = new GameController(new mongoose.Types.ObjectId(game.id) as any as ObjectId,
                this.client, await this.client.guilds.fetch(tokens.GuildID), game.matchNumber, [], [], "SND",
                game.scoreLimit, this.data, server);
            newGame.load(game);
            this.activeGames.push(newGame);
        }
        this.generating = parsed.generating;
        for (let data of parsed.mapData) {
            this.mapData.push(data);
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

    async addUser(user: UserInt, time: number, checkGame: boolean = true): Promise<InternalResponse> {
        if (user.banUntil > moment().unix()) {
            return {success: false, message: `You are currently banned for another ${grammaticalTime(user.banUntil - moment().unix())}`};
        }
        if (this.data.inGame(user._id) && checkGame) {
            return {success: false, message: `You are currently in a game`};
        }
        if (this.generating) {
            return {success: false, message: "Please try again in a couple seconds"};
        }
        if (user.frozen == null) {
            user.frozen = false;
            await updateUser(user, this.data);
        }
        if (user.frozen) {
            return {success: false, message: "You cannot queue as you have a pending ticket please go resolve it in order to queue"}
        }
        if (this.activeAutoQueue) {
            return {success: false, message: "There is an auto queue in progress please wait"}
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
                const dbUser = await getUserById(user.dbId, this.data);
                if (dbUser.dmQueue) {
                    try {
                        await member.dmChannel!.send("Your queue time expires in 3 minutes. If you wish to re ready please do so");
                    } catch (e) {
                        await logWarn(`Could not dm user -${dbUser.id}`, this.client);
                    }
                }
            }
        }
        for (let game of this.activeGames) {
            await game.tick();
            if (game.isProcessed()) {
                await logInfo(`[QueueController.tick] Before clone: game.requeueArray = ${JSON.stringify(game.requeueArray)}`, this.client);
                shuffleArray(game.requeueArray);
                const arrayClone: ObjectId[] = JSON.parse(JSON.stringify(game.requeueArray));
                await logInfo(`[QueueController.tick] After clone: arrayClone = ${JSON.stringify(arrayClone)}`, this.client);
                
                game.requeueArray = [];
                if (!game.abandoned) {
                    await game.cleanup();
                }
                this.activeGames.forEach((gameItr, i) => {if (String(gameItr.id) == String(game.id)) this.activeGames.splice(i, 1)});
                // Add map to last played
                if (game.map != "" && game.scoresAccept[0] && game.scoresAccept[1]) {
                    await addLastPlayedMap(this.data, game.map, game.matchNumber);
                }
                for (let user of arrayClone) {
                    const dbUser = await getUserById(user, this.data);
                    const member = await guild.members.fetch(dbUser.id);
                    const response = await this.addUser(dbUser, 15, false);
                    if (!member.dmChannel) {
                        await member.createDM(true);
                    }
                    if (dbUser.dmAuto) {
                        try {
                            await member.dmChannel!.send(`Auto Ready:\n${response.message}`);
                        } catch (e) {
                            await logWarn(`Could not dm user -${dbUser.id}`, this.client);
                        }
                    }
                }
                game.requeueArray = [];
                await this.data.Leaderboard.setLeaderboard();
            }
            if (game.abandoned && !game.autoReadied) {
                shuffleArray(game.requeueArray);

                const arrayClone: ObjectId[] = JSON.parse(JSON.stringify(game.requeueArray));
                
                game.requeueArray = [];
                this.activeAutoQueue = true;
                for (let user of arrayClone) {
                    const dbUser = await getUserById(user, this.data);
                    const member = await guild.members.fetch(dbUser.id);
                    const response = await this.addUser(dbUser, 15, false);
                    if (!member.dmChannel) {
                        await member.createDM(true);
                    }
                    if (dbUser.dmAuto) {
                        try {
                            await member.dmChannel!.send(`Auto Ready:\n${response.message}`);
                        } catch (e) {
                            await logWarn(`Could not dm user -${dbUser.id}`, this.client);
                        }
                    }
                }
                this.activeAutoQueue = false;
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

        let naUsers = [];
        let euUsers = [];
        let apacUsers = [];
    
        for (let user of this.inQueue) {
            switch (user.region) {
                case Regions.NAE:
                case Regions.NAW:
                    naUsers.push(`${user.name} (${user.region})`);
                    break;
                case Regions.EUE:
                case Regions.EUW:
                    euUsers.push(`${user.name} (${user.region})`);
                    break;
                case Regions.APAC:
                    apacUsers.push(`${user.name} (${user.region})`);
                    break;
            }
        }
    
        if (naUsers.length > 0) {
            queueStr += `\n**NA Users:**\n${grammaticalList(naUsers)}\n`;
        }
        if (euUsers.length > 0) {
            queueStr += `\n**EU Users:**\n${grammaticalList(euUsers)}\n`;
        }
        if (apacUsers.length > 0) {
            queueStr += `\n**APAC Users:**\n${grammaticalList(apacUsers)}\n`;
        }
    
        return queueStr;
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
}
