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
import moment from "moment-timezone";
import {GameController} from "./controllers/GameController";
import {getUserById, getUserByUser} from "./modules/getters/getUser";
import {LeaderboardControllerClass} from "./controllers/LeaderboardController";
import UserModel from "./database/models/UserModel";
import userModel, {Regions, UserInt} from "./database/models/UserModel";
import {getStats} from "./modules/getters/getStats";
import {getRank, roleRemovalCallback} from "./utility/ranking";
import {updateUser} from "./modules/updaters/updateUser";
import {GameServer} from "./server/server";
import {registerMaps} from "./utility/match";
import serializer from "./serializers/serializer";
import MapTestModel from "./database/models/MapTestModel";
import mapTestModel from "./database/models/MapTestModel";
import fs from "fs";
import {join} from "path";

const SAVE_ID = "saved";

export class Data {
    readonly client: Client;
    private userCache = new Map<string, UserInt>();
    private discordToObject = new Map<string, string>();
    private tickLoop = cron.schedule('*/1 * * * * *', async () => {
        await this.tick();
    }, { runOnInit: false });
    private roleUpdate = cron.schedule("0 * * * *", async () => {
        await this.updateRoles();
    }, { runOnInit: false });
    private banCounter = cron.schedule("*/10 * * * *", async () => {
        await this.banReductionTask();
    }, { runOnInit: false });
    private FILL_SND: QueueController;
    nextPing: number = moment().unix();
    readonly Leaderboard = new LeaderboardControllerClass(this);
    private botStatus = "";
    private statusChannel: VoiceChannel | null = null;
    private tickCount = 0;
    private servers: GameServer[] = [];
    private loaded: boolean = false;
    private queueSaveCache = "";

    constructor(client: Client) {
        this.client = client
        this.FILL_SND = new QueueController(this, client, "FILL");
        for (let server of tokens.Servers) {
            this.servers.push(new GameServer(server.ip, server.port, server.password, server.name, Regions.NAE, server.id));
        }
    }

    public getClient() {
        return this.client;
    }

    public getServers() {
        return this.servers;
    }

    private async banReductionTask() {
        const now = moment().unix()
        const users = await userModel.find({}) as UserInt[];
        for (let user of users) {
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

        const mapTestsToDelete = await MapTestModel.find({time: {"$lte": moment().unix() - 3600 * 6}, deleted: false});
        const channel = await this.client.channels.fetch(tokens.MapTestAnnouncementChannel) as TextChannel;
        for (let mapTest of mapTestsToDelete) {
            try {
                const message = await channel.messages.fetch(mapTest.messageId);
                await message.delete();
                mapTest.deleted = true;
                await mapTestModel.findByIdAndUpdate(mapTest._id, mapTest);
            } catch (e) {
                await logWarn(`Failed to delete message for map test (${mapTest.id})`, this.client);
            }
        }

        const mapTestsToNotify = await MapTestModel.find({time: {"$lte": moment().unix() + 3600 * 2}, pinged: false});
        for (let mapTest of mapTestsToNotify) {
            for (let player of mapTest.players) {
                const user = await this.client.users.fetch(player);
                if (user.dmChannel) {
                    await user.dmChannel.send(`You have a map test at <t:${mapTest.time}:F> <t:${mapTest.time}:R>`);
                } else {
                    await user.createDM(true);
                    await user.dmChannel!.send(`You have a map test at <t:${mapTest.time}:F> <t:${mapTest.time}:R>`);
                }
            }
            mapTest.pinged = true;
            await mapTestModel.findByIdAndUpdate(mapTest._id, mapTest);
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

    canJoinStream(userId: string): boolean {
        for (let game of this.FILL_SND.activeGames) {
            for (let user of game.users) {
                if (user.discordId == userId) {
                    return false;
                }
            }
        }
        return true;
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
                if (stats.gamesPlayedSinceReset >= 10) {
                    const rank = getRank(stats.mmr);
                    await member.roles.add(rank.roleId);
                }
            }
            this.userCache.set(String(user._id), user);
            this.discordToObject.set(user.id, String(user._id));
        }
    }

    async load() {
        await logInfo('[load] START - loaded: ' + this.loaded, this.client);
        try {
            const mountedFolder = join(process.cwd(), "../../mounted");
            await logInfo('[load] mountedFolder set: ' + mountedFolder + ' loaded: ' + this.loaded, this.client);
            const savePath = join(mountedFolder, "save.json");
            await logInfo('[load] savePath set: ' + savePath + ' loaded: ' + this.loaded, this.client);
            // Check if save file exists
            if (!fs.existsSync(savePath)) {
                await logInfo('[load] No save file found, starting fresh. loaded: ' + this.loaded, this.client);
                registerMaps(this, tokens.MapPool);
                await logInfo('[load] registerMaps called for fresh start. loaded: ' + this.loaded, this.client);
                this.tickLoop.start();
                await logInfo('[load] tickLoop started for fresh start. loaded: ' + this.loaded, this.client);
                this.roleUpdate.start();
                await logInfo('[load] roleUpdate started for fresh start. loaded: ' + this.loaded, this.client);
                this.banCounter.start();
                await logInfo('[load] banCounter started for fresh start. loaded: ' + this.loaded, this.client);
                await logInfo('[load] logInfo called for fresh start. loaded: ' + this.loaded, this.client);
                return;
            }
            await logInfo('[load] Save file exists. loaded: ' + this.loaded, this.client);
            const saveData = fs.readFileSync(savePath).toString();
            await logInfo('[load] saveData read from file. Length: ' + saveData.length + ' loaded: ' + this.loaded, this.client);
            const save = JSON.parse(saveData);
            await logInfo('[load] saveData parsed. Keys: ' + Object.keys(save) + ' loaded: ' + this.loaded, this.client);
            if (save && save.queueSND) {
                try {
                    await logInfo('[load] Attempting to deserialize queue. loaded: ' + this.loaded, this.client);
                    this.FILL_SND = await serializer.deserializeQueueSND(save.queueSND, this.client, this);
                    await logInfo('[load] Queue deserialized successfully. loaded: ' + this.loaded, this.client);
                } catch (e) {
                    await logInfo('[load] Failed to deserialize queue: ' + e + ' loaded: ' + this.loaded, this.client);
                }
            } else {
                await logInfo('[load] No queue data found in save file. loaded: ' + this.loaded, this.client);
            }
            if (save && save.gamesSND && Array.isArray(save.gamesSND)) {
                await logInfo(`[load] Found ${save.gamesSND.length} games to deserialize. loaded: ` + this.loaded, this.client);
                for (let i = 0; i < save.gamesSND.length; i++) {
                    try {
                        await logInfo(`[load] Deserializing game ${i + 1}/${save.gamesSND.length}. loaded: ` + this.loaded, this.client);
                        const game = await serializer.deserializeGame(save.gamesSND[i], this.client, this);
                        this.FILL_SND.activeGames.push(game);
                        await logInfo(`[load] Game ${i + 1} deserialized successfully. loaded: ` + this.loaded, this.client);
                        await logInfo(`[load] Game ${game.matchNumber} requeueArray loaded with ${game.requeueArray?.length || 0} users: ${JSON.stringify(game.requeueArray)}`, this.client);
                    } catch (e) {
                        await logInfo(`[load] Failed to deserialize game ${i + 1}: ` + e + ' loaded: ' + this.loaded, this.client);
                    }
                }
            } else {
                await logInfo('[load] No games found in save file. loaded: ' + this.loaded, this.client);
            }
            await logInfo(`[load] Recovery complete: ${this.FILL_SND.activeGames.length} games recovered. loaded: ` + this.loaded, this.client);
        } catch (e) {
            await logInfo('[load] Critical error during load: ' + e + ' loaded: ' + this.loaded, this.client);
        }
        registerMaps(this, tokens.MapPool);
        await logInfo('[load] registerMaps called after load. loaded: ' + this.loaded, this.client);
        this.tickLoop.start();
        await logInfo('[load] tickLoop started after load. loaded: ' + this.loaded, this.client);
        this.roleUpdate.start();
        await logInfo('[load] roleUpdate started after load. loaded: ' + this.loaded, this.client);
        this.banCounter.start();
        await logInfo('[load] banCounter started after load. loaded: ' + this.loaded, this.client);
        await logInfo('[load] logInfo called after load. loaded: ' + this.loaded, this.client);
        this.setLoaded(true);
        await logInfo('[load] setLoaded(true) called. loaded: ' + this.loaded, this.client);
    }

    getServer(name: string) {
        for (let server of this.servers) {
            if (name == server.name) {
                return server;
            }
        }
        return null;
    }
    getServerById(id: string) {
        for (let server of this.servers) {
            if (id == server.id) {
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
        if (!this.loaded) {
            return;
        }
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
            await this.FILL_SND.tick();
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
        } catch (e) {
            console.error(e)
            await logWarn("Error in main tick loop", this.client);
        }
    }

    async save() {
        if (!this.loaded) {
            return;
        }
        let queue = serializer.serializeQueueSND(this.FILL_SND);
        let games = [];
        for (let game of this.FILL_SND.activeGames) {
            games.push(serializer.serializeGame(game));
        }
        const saveObj = {
            id: SAVE_ID,
            queueSND: queue,
            gamesSND: games,
        };
        if (queue != this.queueSaveCache || games.length != 0) {
            const mountedFolder = join(process.cwd(), "../../mounted");
            fs.writeFileSync(join(mountedFolder, "save.json"), JSON.stringify(saveObj));
        }
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
        const teams = await makeTeams(users, this.client);
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
            let game = new GameController(dbGame._id, this.client, await this.client.guilds.fetch(tokens.GuildID), gameNum, teams.teamA, teams.teamB, queueId, scoreLimit, this, serv);
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
        // Updates a user's username in db if changed
        if (dbUser.name != user.username) {
            dbUser.name = user.username;
            await updateUser(dbUser, this);
        }
        if (!dbUser.oculusName) {
            return {success: false, message: "You need to set a name using `/register` before queueing"};
        }
        if (!dbUser.region) {
            return {success: false, message: `You must set a region in <#${tokens.RegionSelect}> before you can play`}
        }
        const queueController = this.getQueue();
        if (!queueController.locked) {
            return await queueController.addUser(dbUser, time);
        }
        return {success: false, message: "This queue is currently locked"}
    }

    async addPingMe(queueId: string, queue: string, user: User, inQueue: number, expire_time: number) {
        const controller = this.getQueue();
        await controller.addPingMe(user.id, inQueue, expire_time);
    }

    lockQueue() {
        this.getQueue().lock();
    }

    unlockQueue() {
        this.getQueue().unlock();
    }

    isLocked() {
        return this.getQueue().locked;
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
