import {Client, Collection, User} from "discord.js";
import cron from 'node-cron';
import {logInfo} from "./loggers";
import {QueueController} from "./controllers/QueueController";
import {QueueUser} from "./interfaces/Game";
import {makeTeams} from "./utility/makeTeams"
import {getCounter} from "./modules/getters/getCounter";
import {createGame} from "./modules/constructors/createGame";
import {ObjectId} from "mongoose";
import tokens from "./tokens";
import {InternalResponse} from "./interfaces/Internal";
import moment from "moment";
import {GameController} from "./controllers/GameController";
import {getUserByUser} from "./modules/getters/getUser";
import LeaderboardController from "./controllers/LeaderboardController";
import {updateGameController} from "./modules/updaters/updateGameController";
import {createGameController} from "./modules/constructors/createGameController";
import {updateQueueController} from "./modules/updaters/updateQueueController";
import {getQueueController} from "./modules/getters/getQueueController";
import {QueueControllerInt} from "./database/models/QueueControllerModel";

export class Data {
    private readonly client: Client;
    private saveLoop = cron.schedule('*/1 * * * * *', async () => {
        await this.save()
    });
    private tickLoop = cron.schedule('*/1 * * * * *', async () => {
        await this.tick()
    });
    private readonly NA_SND: QueueController;
    private readonly EU_SND: QueueController;
    private readonly APAC_SND: QueueController;
    private readonly FILL_SND: QueueController;
    private sndQueues: QueueController[] = []
    private locked: Collection<string, boolean> = new Collection<string, boolean>();
    nextPing: number = moment().unix();
    readonly Leaderboard = LeaderboardController;

    constructor(client: Client) {
        this.client = client
        this.NA_SND = new QueueController(this, client, "NA");
        this.EU_SND = new QueueController(this, client, "EU");
        this.APAC_SND = new QueueController(this, client, "APAC");
        this.FILL_SND = new QueueController(this, client, "FILL");
        this.sndQueues.push(this.FILL_SND, this.NA_SND, this.EU_SND, this.APAC_SND);
    }

    async load() {
        this.saveLoop.start();
        this.tickLoop.start();
        const queueDB = await getQueueController("SND", "FILL")
        await this.FILL_SND.load(queueDB as QueueControllerInt);
        await logInfo("Data Loaded!", this.client);
    }

    async save() {
        for (let game of this.getGames()) {
            await updateGameController(game);
        }
        await updateQueueController(this.FILL_SND);
    }

    getGames() {
        let games: GameController[] = [];
        for (let game of this.FILL_SND.activeGames) {
            games.push(game);
        }
        return games;
    }

    async tick() {
        let totalNA = 0;
        let totalEU = 0;
        let totalAPAC = 0;
        for (let queue of this.sndQueues) {
            await queue.tick();
            if (queue.queueName == "NA") {
                totalNA += queue.inQueueNumber();
            } else if (queue.queueName == "EU") {
                totalEU += queue.inQueueNumber();
            } else if (queue.queueName == "APAC") {
                totalAPAC += queue.inQueueNumber()
            } else {
                let number = queue.inQueueNumber();
                totalNA += number;
                totalEU += number;
                totalAPAC +=number;
            }
        }
        if (totalNA >= tokens.PlayerCount) {
            await this.createMatch("NA", this.NA_SND, 'SND', tokens.ScoreLimitSND);
        } else if (totalEU >= tokens.PlayerCount) {
            await this.createMatch("EU", this.EU_SND, 'SND', tokens.ScoreLimitSND);
        } else if (totalAPAC >= tokens.PlayerCount) {
            await this.createMatch("APAC", this.APAC_SND, 'SND', tokens.ScoreLimitSND);
        }
    }

    async createMatch(regionId: string, queue: QueueController, queueId: string, scoreLimit: number) {
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
            const game = new GameController(dbGame._id, this.client, await this.client.guilds.fetch(tokens.GuildID), gameNum, teams.teamA, teams.teamB, queueId, scoreLimit);
            await createGameController(game);
            queue.addGame(game);
        } catch (e) {
            console.error(e);
        }
    }

    findController(id: ObjectId) {
        if (this.NA_SND.inGame(id)) {
            return this.NA_SND;
        }
        if (this.EU_SND.inGame(id)) {
            return this.EU_SND;
        }
        if (this.APAC_SND.inGame(id)) {
            return this.APAC_SND;
        }
    }

    getQueue(region: string) {
        switch (region) {
            case "NA": return this.NA_SND
            case "EU": return this.EU_SND
            case "APAC": return this.APAC_SND
            case "FILL": return this.FILL_SND
        }
    }

    async ready(queueId: string, queue: string, user: User, time: number): Promise<InternalResponse> {
        const dbUser = await getUserByUser(user);
        this.removeFromQueue(dbUser._id, queueId);
        if (!this.locked.get(queueId)) {
            const controller = this.getQueue(queue)!;
            return await controller.addUser(dbUser, time);
        }
        return {success: false, message: "This queue is currently locked"}
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
        this.NA_SND.removeUser(userId);
        this.EU_SND.removeUser(userId);
        this.APAC_SND.removeUser(userId);
        this.FILL_SND.removeUser(userId);
    }

    removeFromQueue(userId: ObjectId, queueId: string) {
        if (queueId == "SND") {
            this.NA_SND.removeUser(userId);
            this.EU_SND.removeUser(userId);
            this.APAC_SND.removeUser(userId);
            this.FILL_SND.removeUser(userId);
        } else if (queueId == "ALL") {
            this.NA_SND.removeUser(userId);
            this.EU_SND.removeUser(userId);
            this.APAC_SND.removeUser(userId);
            this.FILL_SND.removeUser(userId);
        }
    }

    inGame(userId: ObjectId): boolean {
        if (this.NA_SND.inGame(userId)) {
            return true;
        }
        if (this.EU_SND.inGame(userId)) {
            return true;
        }
        if (this.APAC_SND.inGame(userId)) {
            return true;
        }
        return this.FILL_SND.inGame(userId);
    }

    findGame(userId: ObjectId) {
        if (this.NA_SND.inGame(userId)) {
            return this.NA_SND.getGame(userId);
        }
        if (this.EU_SND.inGame(userId)) {
            return this.EU_SND.getGame(userId);
        }
        if (this.APAC_SND.inGame(userId)) {
            return this.APAC_SND.getGame(userId);
        }
        return this.FILL_SND.getGame(userId);
    }

    getGameByChannel(id: string) {
        let game = this.NA_SND.getGameByChannel(id);
        if (game) {
            return game;
        }
        game = this.EU_SND.getGameByChannel(id);
        if (game) {
            return game;
        }
        game = this.APAC_SND.getGameByChannel(id);
        if (game) {
            return game;
        }
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
            this.EU_SND.clearQueue();
            this.APAC_SND.clearQueue();
            this.NA_SND.clearQueue();
        }
    }

    async getQueueInfo(queueId: string): Promise<InternalResponse> {
        let queues = []
        if (queueId == 'SND') {
            queues.push(this.APAC_SND.getInfo(),
                this.NA_SND.getInfo(),
                this.EU_SND.getInfo(),
                this.FILL_SND.getInfo())
        }
        return {success: true, message: `data for ${queueId}`, data: queues};
    }
}