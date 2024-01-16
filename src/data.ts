import {Client, Collection, User, ActivityType, VoiceChannel, TextChannel} from "discord.js";
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
import {getStats} from "./modules/getters/getStats";
import {getRank, roleRemovalCallback} from "./utility/ranking";
import userModel from "./database/models/UserModel";
import {updateUser} from "./modules/updaters/updateUser";
import {Server} from "./server/server";

export class Data {
    private readonly client: Client;
    private tickLoop = cron.schedule('*/1 * * * * *', async () => {
        await this.tick()
    });
    private roleUpdate = cron.schedule("0 * * * *", async () => {
        await this.updateRoles();
    });
    private banCounter = cron.schedule("*/10 * * * *", async () => {
        const now = moment().unix()
        const users = await userModel.find({});
        for (let user of users) {
            if (!user.lastReduction) {
                user.lastReduction = 0;
                user = await updateUser(user);
            }
            if (!user.gamesPlayedSinceReduction) {
                user.gamesPlayedSinceReduction = 0;
                user = await updateUser(user);
            }
            if (user.lastReduction + 60 * 60 * 24 * 14 < now) {
                if (user.banCounter > 0) {
                    user.banCounter --;
                    user.lastReduction = now;
                    user.gamesPlayedSinceReduction = 0;
                    await updateUser(user);
                }
            }
            if (user.gamesPlayedSinceReduction >= 7) {
                if (user.banCounter > 0) {
                    user.banCounter --;
                    user.lastReduction = now;
                    user.gamesPlayedSinceReduction = 0;
                    await updateUser(user);
                }
            }
        }
    })
    private readonly FILL_SND: QueueController;
    private locked: Collection<string, boolean> = new Collection<string, boolean>();
    nextPing: number = moment().unix();
    readonly Leaderboard = new LeaderboardControllerClass();
    private botStatus = "";
    private statusChannel: VoiceChannel | null = null;
    private tickCount = 0;
    private servers: Server[] = [];

    constructor(client: Client) {
        this.client = client
        this.FILL_SND = new QueueController(this, client, "FILL");
        for (let server of tokens.Servers) {
            this.servers.push(new Server(server.ip, server.port, server.password, server.name,client));
        }
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
        }
    }

    async load() {
        this.tickLoop.start();
        this.roleUpdate.start();
        this.banCounter.start();
        await logInfo("Data Loaded!", this.client);
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
            this.tickCount++;
            if (!this.statusChannel || this.tickCount % 60 == 0) {
                const guild = await this.client.guilds.fetch(tokens.GuildID);
                this.statusChannel = await guild.channels.fetch(tokens.ActiveGamesChannel) as VoiceChannel;
            }
            if (this.FILL_SND.inQueueNumber() >= tokens.PlayerCount) {
                await this.createMatch("NA", this.FILL_SND, 'SND', tokens.ScoreLimitSND);
            }
            await this.FILL_SND.tick()
            const check = `${this.FILL_SND.inQueueNumber()} in queue`;
            if (check != this.botStatus) {
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
            await logWarn("Error in main tick loop", this.client);
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
            let serv: Server | null = null;
            for (let server of this.servers) {
                if (!server.isInUse()) {
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
            const dbUser = await getUserById(user.dbId);
            if (dbUser.requeue == null) {
                dbUser.requeue = true;
                await updateUser(dbUser);
            }
            if (dbUser.requeue) {
                const stats = await getStats(user.dbId, "SND");
                queue.push({
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
        const dbUser = await getUserByUser(user);
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