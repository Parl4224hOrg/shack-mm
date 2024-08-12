import {ActivityType, Client, Collection, TextChannel, User, VoiceChannel} from "discord.js";
import cron from 'node-cron';
import {logInfo, logWarn} from "./loggers";
import {QueueController} from "./controllers/QueueController";
import {GameUser, QueueUser} from "./interfaces/Game";
import {makeTeams} from "./utility/makeTeams"
import {getCounter} from "./modules/getters/getCounter";
import {createGame} from "./modules/constructors/createGame";
import {ObjectId} from "mongoose";
import tokens from "./tokens";
import {InternalResponse} from "./interfaces/Internal";
import moment from "moment";
import {GameController} from "./controllers/GameController";
import {getUserById, getUserByUser} from "./modules/getters/getUser";
import {LeaderboardControllerClass} from "./controllers/LeaderboardController";
import UserModel from "./database/models/UserModel";
import userModel, {Regions, UserInt} from "./database/models/UserModel";
import {getStats} from "./modules/getters/getStats";
import {getRank, roleRemovalCallback} from "./utility/ranking";
import {updateUser} from "./modules/updaters/updateUser";
import {GameServer} from "./server/server";
import SaveModel from "./database/models/SaveModel";

export class Data {
    private readonly client: Client;
    private userCache = new Map<string, UserInt>();
    private discordToObject = new Map<string, string>();
    private tickLoop = cron.schedule('*/1 * * * * *', async () => {
        await this.tick();
    })
    private roleUpdate = cron.schedule("0 * * * *", async () => {
        await this.updateRoles();
    });
    private banCounter = cron.schedule("*/10 * * * *", async () => {
        await this.banReductionTask();
    });
    private readonly FILL_SND: QueueController;
    private locked: Collection<string, boolean> = new Collection<string, boolean>();
    nextPing: number = moment().unix();
    readonly Leaderboard = new LeaderboardControllerClass(this);
    private botStatus = "";
    private statusChannel: VoiceChannel | null = null;
    private tickCount = 0;
    private servers: GameServer[] = [];
    private loaded: boolean = false;
    private saveCache = "";

    constructor(client: Client) {
        this.client = client
        this.FILL_SND = new QueueController(this, client, "FILL");
        for (let server of tokens.Servers) {
            this.servers.push(new GameServer(server.ip, server.port, server.password, server.name, Regions.NAE, server.id));
        }
    }

    public getServers() {
        return this.servers;
    }

    private async banReductionTask() {
        const now = moment().unix()
        const users = await userModel.find({}) as UserInt[];
        const guild = await this.client.guilds.fetch(tokens.GuildID);
        for (let user of users) {
            if (user.muteUntil <= now && user.muteUntil > 0) {
                try {
                    const member = await guild.members.fetch(user.id);
                    await member.roles.remove(tokens.MutedRole);
                } catch (e) {
                    await logWarn("User is no longer in server", this.client);
                }
            }
            if (user.banUntil <= now) {
                // Check for two week reduction
                if (user.lastReductionAbandon + 60 * 60 * 24 * 14 <= now) {
                    if (user.banCounterAbandon > 0) {
                        user.banCounterAbandon--;
                        user.lastReductionAbandon = now;
                        user.gamesPlayedSinceReductionAbandon = 0;
                        user = await updateUser(user, this);
                    }
                }
                if (user.lastReductionFail + 60 * 60 * 24 * 14 <= now) {
                    if (user.banCounterFail > 0) {
                        user.banCounterFail--;
                        user.lastReductionFail = now;
                        user.gamesPlayedSinceReductionFail = 0;
                        user = await updateUser(user, this);
                    }
                }
                // Check for game count reduction
                if (user.gamesPlayedSinceReductionAbandon >= tokens.ReductionGames) {
                    if (user.banCounterAbandon > 0) {
                        user.banCounterAbandon--;
                        user.lastReductionAbandon = now;
                        user.gamesPlayedSinceReductionAbandon = 0;
                        user = await updateUser(user, this);
                    }
                }
                if (user.gamesPlayedSinceReductionFail >= tokens.ReductionGames) {
                    if (user.banCounterFail > 0) {
                        user.banCounterFail--;
                        user.lastReductionFail = now;
                        user.gamesPlayedSinceReductionFail = 0;
                        user = await updateUser(user, this);
                    }
                }
            }
        }
    }

    checkCacheByDiscord(id: string) {
        const dbId = this.discordToObject.get(id);
        if (!dbId) {return undefined}
        return this.userCache.get(dbId);
    }

    checkCache(id: string) {
        return this.userCache.get(id);
    }

    cacheUser(user: UserInt) {
        this.userCache.set(String(user._id), user);
        this.discordToObject.set(user.id, String(user._id));
    }

    async updateRoles() {
        const users = await UserModel.find({});
        const guild = await this.client.guilds!.fetch(tokens.GuildID);
        for (let user of users) {
            const stats = await getStats(user._id,  "SND");
            const member = await guild.members.fetch(user.id);
            if (member) {
                member.roles.cache.forEach((value) => {
                    roleRemovalCallback(value, member)
                });
                if (stats.gamesPlayed >= 10) {
                    const rank = getRank(stats.mmr);
                    await member.roles.add(rank.roleId);
                }
            }
            this.userCache.set(String(user._id), user);
            this.discordToObject.set(user.id, String(user._id));
        }
    }

    async load() {
        const data = await SaveModel.findOne({id: 'test'});
        if (data) {
            await this.FILL_SND.load(data.data);
        }
        this.tickLoop.start();
        this.roleUpdate.start();
        this.banCounter.start();
        await logInfo("Data Loaded!", this.client);
    }

    getServer(name: string) {
        for (let server of this.servers) {
            if (name == server.name) {
                return server;
            }
        }
        return null;
    }

    setLoaded(value: boolean) {
        this.loaded = value;
    }

    getGames() {
        let games: GameController[] = [];
        for (let game of this.FILL_SND.activeGames) {
            games.push(game);
        }
        return games;
    }

    async tick() {
        try {
            await this.save();
            this.tickCount++;
            if (!this.statusChannel || this.tickCount % 60 == 0) {
                const guild = await this.client.guilds.fetch(tokens.GuildID);
                this.statusChannel = await guild.channels.fetch(tokens.ActiveGamesChannel) as VoiceChannel;
            }
            if (this.FILL_SND.inQueueNumber() >= tokens.PlayerCount) {
                await this.createMatch("NA", this.FILL_SND, 'SND', tokens.ScoreLimitSND);
            }
            await this.FILL_SND.tick()
            const check = `${this.FILL_SND.inQueueNumber()} in q`;
            if (check != this.botStatus && this.loaded) {
                this.botStatus = check;
                this.client.user!.setActivity({
                    name: check,
                    type: ActivityType.Watching,
                });
            }
            const active = `Active Games: ${this.FILL_SND.activeGames.length}`;
            if (active != this.statusChannel!.name) {
                await this.statusChannel!.setName(active);
            }
            if (this.Leaderboard.changed) {
                const channel = await this.client.channels.fetch(tokens.LeaderboardChannel) as TextChannel;
                const message = await channel.messages.fetch(tokens.LeaderboardMessage);
                await message.edit({content: this.Leaderboard.leaderboardCacheSND, components: []});
                this.Leaderboard.changed = false;
            }
        } catch (e) {
            console.error(e)
            await logWarn("Error in main tick loop", this.client);
        }
    }

    async save() {
        let queue = JSON.stringify(this.FILL_SND, function (key, value) {
            try {
                if (key == 'client' || key == 'data' || key == 'guild') {
                    return;
                }
                return value;
            } catch (e) {
                console.error(e);
            }
        });
        if (queue != this.saveCache) {
            const doc = await SaveModel.findOne({id: "test"});
            if (!doc) {
                await SaveModel.create({id: 'test', data: queue});
            } else {
                await SaveModel.updateOne({id: "test"}, {id: "test", data: queue});
            }
        }
        return;
    }

    async createMatch(regionId: string, queue: QueueController, queueId: string, scoreLimit: number) {
        queue.generating = true;
        let users: QueueUser[] = []
        while (users.length < tokens.PlayerCount && queue.inQueueNumber() > 0) {
            users.push(queue.getUser())
        }
        while (users.length < tokens.PlayerCount) {
            users.push(this.FILL_SND.getUser())
        }
        const teams = await makeTeams(users);
        let userIds: ObjectId[] = [];

        for (let user of teams.teamA) {
            userIds.push(user.db);
            this.removeFromAllQueues(user.db);
        }

        for (let user of teams.teamB) {
            userIds.push(user.db);
            this.removeFromAllQueues(user.db);
        }

        try {
            const gameNum = await this.getIdSND()
            const dbGame = await createGame(gameNum, "SND", userIds, teams.teamA, teams.teamB, teams.mmrDiff, regionId);
            let serv: GameServer | null = null;
            const inUseServers: string[] = [];
            for (let game of this.getQueue().activeGames) {
                inUseServers.push(game.serverId)
            }
            for (let server of this.servers) {
                if (!inUseServers.includes(server.id)) {
                    serv = server;
                }
            }
            let game = new GameController(dbGame._id, this.client, await this.client.guilds.fetch(tokens.GuildID), gameNum, teams.teamA, teams.teamB, queueId, scoreLimit, this.FILL_SND.lastPlayedMaps, this, serv);
            queue.addGame(game);
        } catch (e) {
            console.error(e);
        }
    }

    async addAbandoned(users: GameUser[]) {
        const queue: QueueUser[] = [];
        for (let user of users) {
            const dbUser = await getUserById(user.dbId, this);
            if (dbUser.requeue == null) {
                dbUser.requeue = true;
                await updateUser(dbUser, this);
            }
            if (dbUser.requeue) {
                const stats = await getStats(user.dbId, "SND");
                queue.unshift({
                    dbId: user.dbId,
                    discordId: user.discordId,
                    queueExpire: moment().unix() + 15 * 60,
                    mmr: stats.mmr,
                    name: dbUser.name,
                    region: dbUser.region,
                });
            }
        }
        this.FILL_SND.setInQueue(queue);
    }

    findController() {
        return this.FILL_SND
    }

    getQueue() {
        return this.FILL_SND
    }

    async ready(queueId: string, queue: string, user: User, time: number): Promise<InternalResponse> {
        const dbUser = await getUserByUser(user, this);
        if (!dbUser.oculusName) {
            return {success: false, message: "You need to set a name using `/register` before queueing"};
        }
        if (!dbUser.region) {
            return {success: false, message: `You must set a region in <#${tokens.RegionSelect}> before you can play`}
        }
        if (!this.locked.get(queueId)) {
            const controller = this.getQueue();
            return await controller.addUser(dbUser, time);
        }
        return {success: false, message: "This queue is currently locked"}
    }

    async addPingMe(queueId: string, queue: string, user: User, inQueue: number, expire_time: number) {
        const controller = this.getQueue();
        await controller.addPingMe(user.id, inQueue, expire_time);
    }

    lockQueue(queueId: string) {
        this.locked.set(queueId, true);
    }

    unlockQueue(queueId: string) {
        this.locked.set(queueId, false);
    }

    isLocked(queueId: string) {
        return this.locked.get(queueId);
    }

    lockAllQueues() {
        for (let key of this.locked.keys()) {
            this.locked.set(key, true);
        }
    }

    removeFromAllQueues(userId: ObjectId) {
        this.FILL_SND.removeUser(userId, false);
    }

    removeFromQueue(userId: ObjectId, queueId: string) {
        if (queueId == "SND") {
            this.FILL_SND.removeUser(userId, false);
        } else if (queueId == "ALL") {
            this.removeFromAllQueues(userId);
        }
    }

    inGame(userId: ObjectId): boolean {
        return this.FILL_SND.inGame(userId);
    }

    findGame(userId: ObjectId) {
        return this.FILL_SND.getGame(userId);
    }

    getGameByChannel(id: string) {
        return this.FILL_SND.getGameByChannel(id);
    }

    inQueueSND() {
        return `${this.FILL_SND.getQueueStr()}`
    }

    async getIdSND() {
        const counter = await getCounter('SND COUNTER');
        return counter.value;
    }

    clearQueue(queueId: string) {
        if (queueId == 'SND') {
            this.FILL_SND.clearQueue();
        }
    }

    async getQueueInfo(queueId: string): Promise<InternalResponse> {
        let queues = []
        queues.push(this.FILL_SND.getInfo());
        return {success: true, message: `data for ${queueId}`, data: queues};
    }
}
