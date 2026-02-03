import {GameController} from "../controllers/GameController";
import {Collection, Client} from "discord.js";
import {Types} from "mongoose";
import tokens from "../tokens";
import {GameUser} from "../interfaces/Game";
import {Data} from "../data";
import {Regions} from "../database/models/UserModel";
import {QueueController} from "../controllers/QueueController";
import {PingMeUser} from "../interfaces/Internal";
import {MapInt} from "../database/models/MapModel";

class Serializer {
    private replaceLast(toReplace: string, replaceWith: string): string {
        const trimmed = toReplace.slice(0, -1);
        return trimmed + replaceWith;
    }

    private votesSerializer(toSerialize: Collection<string, string[]>): string {
        let data = "{ ";
        for (let key of toSerialize.keys()) {
            data += `"${key}": ${JSON.stringify(toSerialize.get(key))},`;
        }
        return this.replaceLast(data, "}");
    }

    private pingMeSerializer(toSerialize: Collection<string, PingMeUser>): string {
        let data = "{ ";
        for (let key of toSerialize.keys()) {
            data += `"${key}": ${JSON.stringify(toSerialize.get(key))},`;
        }
        return this.replaceLast(data, "}");
    }
    
    private joinedPlayersSerializer(toSerialize: Set<string>): string {
        let data = "[ ";
        for (let entry of toSerialize.values()) {
            data += `${JSON.stringify(entry)},`;
        }
        return this.replaceLast(data, "]");
    }

    private mapsSerializer(toSerialize: MapInt[]): string {
        let data = "[ ";
        for (let entry of toSerialize) {
            data += `${JSON.stringify(entry)},`;
        }
        return this.replaceLast(data, "]");
    }

    private requeueSerializer(toSerialize: Types.ObjectId[]): string {
        let data = "[ ";
        for (let entry of toSerialize) {
            data += `"${entry.toHexString()}",`;
        }
        return this.replaceLast(data, "]");
    }

    public serializeGame(toSerialize: GameController): string {
        const alreadySerialized = ["votes", "joinedPlayers", "maps"];
        return JSON.stringify({
            id: toSerialize.id,
            matchNumber: toSerialize.matchNumber,
            tickCount: toSerialize.tickCount,
            state: toSerialize.state,
            users: toSerialize.users,
            queueId: toSerialize.queueId,
            scoreLimit: toSerialize.scoreLimit,
            startTime: toSerialize.startTime,
            acceptChannelGen: toSerialize.acceptChannelGen,
            acceptChannelId: toSerialize.acceptChannelId,
            matchRoleId: toSerialize.matchRoleId,
            acceptCountdown: toSerialize.acceptCountdown,
            voteChannelsGen: toSerialize.voteChannelsGen,
            teamAChannelId: toSerialize.teamAChannelId,
            teamARoleId: toSerialize.teamARoleId,
            teamAVCid: toSerialize.teamAVCid,
            teamBChannelId: toSerialize.teamBChannelId,
            teamBRoleId: toSerialize.teamBRoleId,
            teamBVCid: toSerialize.teamBVCid,
            voteA1MessageId: toSerialize.voteA1MessageId,
            voteB1MessageId: toSerialize.voteB1MessageId,
            voteA2MessageId: toSerialize.voteA2MessageId,
            voteB2MessageId: toSerialize.voteB2MessageId,
            voteCountdown: toSerialize.voteCountdown,
            votes: this.votesSerializer(toSerialize.votes),
            mapSet: toSerialize.mapSet,
            sideSet: toSerialize.sideSet,
            currentMaxVotes: toSerialize.currentMaxVotes,
            allBans: toSerialize.allBans,
            map: toSerialize.map,
            sides: toSerialize.sides,
            finalChannelGen: toSerialize.finalChannelGen,
            finalChannelId: toSerialize.finalChannelId,
            scores: toSerialize.scores,
            scoresAccept: toSerialize.scoresAccept,
            scoresConfirmMessageSent: toSerialize.scoresConfirmMessageSent,
            processed: toSerialize.processed,
            abandoned: toSerialize.abandoned,
            abandonCountdown: toSerialize.abandonCountdown,
            cleanedUp: toSerialize.cleanedUp,
            submitCooldown: toSerialize.submitCooldown,
            pleaseStop: toSerialize.pleaseStop,
            processing: toSerialize.processing,
            working: toSerialize.working,
            finalGenTime: toSerialize.finalGenTime,
            requeueArray: this.requeueSerializer(toSerialize.requeueArray),
            server: toSerialize.server?.id ?? "none",
            acceptMessageId: toSerialize.acceptMessageId,
            autoReadied: toSerialize.autoReadied,
            initServer: toSerialize.initServer,
            serverSetup: toSerialize.serverSetup,
            joinedPlayers: this.joinedPlayersSerializer(toSerialize.joinedPlayers),
            serverId: toSerialize.serverId,
            maps: this.mapsSerializer(toSerialize.maps),
            votingFinished: toSerialize.votingFinished,
            usedCommunity: toSerialize.usedCommunity,
            gameStarted: toSerialize.gameStarted,
        }, (key, value) => {
            try {
                if (alreadySerialized.includes(key)) {
                    return JSON.parse(value);
                }
                return value;
            } catch (e) {
                console.error(e);
            }
        })
    }

    public serializeQueueSND(toSerialize: QueueController): string {
        return JSON.stringify({
            queueId: toSerialize.queueId,
            queueName: toSerialize.queueName,
            inQueue: toSerialize.inQueue,
            pingMe: this.pingMeSerializer(toSerialize.pingMe),
            generating: toSerialize.generating,
            mapData: toSerialize.mapData,
            locked: toSerialize.locked,
        });
    }

    private deSerializeUsers(data: any): GameUser[] {
        const users: GameUser[] = [];
        for (let user of data) {
            users.push({
                dbId: Types.ObjectId.createFromHexString(user.dbId),
                discordId: user.discordId,
                team: user.team,
                accepted: user.accepted,
                region: user.region as Regions,
                joined: user.joined,
                isLate: false,
                hasBeenGivenLate: false,
            });
        }
        return users;
    }

    private votesDeserializer(data: any): Collection<string, string[]> {
        const newCollection: Collection<string, string[]> = new Collection();
        for (let key of Object.keys(data)) {
            newCollection.set(key, data[key]);
        }
        return newCollection;
    }

    private pingMeDeserializer(data: any): Collection<string, PingMeUser> {
        const newCollection: Collection<string, PingMeUser> = new Collection();
        const parsed = JSON.parse(data);
        for (let key of Object.keys(parsed)) {
            newCollection.set(key, {
                id: parsed[key].id,
                inQueue: parsed[key].inQueue,
                expires: parsed[key].expires,
                pinged: parsed[key].pinged,
            });
        }
        return newCollection;
    }

    private joinedPlayersDeserializer(data: any): Set<string> {
        const newSet: Set<string> = new Set();
        for (let value of data) {
            newSet.add(value);
        }
        return newSet;
    }

    private mapsDeserializer(data: any): MapInt[] {
        const newArray = [];
        for (let value of data) {
            newArray.push(value);
        }
        return newArray;
    }

    private requeueDeserializer(data: any): Types.ObjectId[] {
        try {
            const newArray = [];
            for (let value of JSON.parse(data) as string[]) {
                newArray.push(Types.ObjectId.createFromHexString(value));
            }
            return newArray;
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    public async deserializeGame(data: string, client: Client, dataClass: Data): Promise<GameController> {
        console.log("Loading Game")
        const parsed = JSON.parse(data);
        console.log(parsed);
        
        const id = Types.ObjectId.createFromHexString(parsed.id);
        const guild = await client.guilds.fetch(tokens.GuildID);
        
        const game = new GameController(id, client, guild, parsed.matchNumber, [], [], parsed.queueId, parsed.scoreLimit, dataClass, null);
        
        game.tickCount = parsed.tickCount;
        game.state = parsed.state;
        game.users = this.deSerializeUsers(parsed.users);
        game.startTime = parsed.startTime;
        game.acceptChannelGen = parsed.acceptChannelGen;
        game.acceptChannelId = parsed.acceptChannelId;
        game.matchRoleId = parsed.matchRoleId;
        game.acceptCountdown = parsed.acceptCountdown;
        game.voteChannelsGen = parsed.voteChannelsGen;
        game.teamAChannelId = parsed.teamAChannelId;
        game.teamARoleId = parsed.teamARoleId;
        game.teamAVCid = parsed.teamAVCid;
        game.teamBChannelId = parsed.teamBChannelId;
        game.teamBRoleId = parsed.teamBRoleId;
        game.teamBVCid = parsed.teamBVCid;
        game.voteA1MessageId = parsed.voteA1MessageId;
        game.voteB1MessageId = parsed.voteB1MessageId;
        game.voteA2MessageId = parsed.voteA2MessageId;
        game.voteB2MessageId = parsed.voteB2MessageId;
        game.voteCountdown = parsed.voteCountdown;
        game.votes = this.votesDeserializer(parsed.votes);
        game.mapSet = parsed.mapSet;
        game.sideSet = parsed.sideSet;
        game.currentMaxVotes = parsed.currentMaxVotes;
        game.allBans = parsed.allBans;
        game.map = parsed.map;
        game.sides = parsed.sides;
        game.finalChannelGen = parsed.finalChannelGen;
        game.finalChannelId = parsed.finalChannelId;
        game.scores = parsed.scores;
        game.scoresAccept = parsed.scoresAccept;
        game.scoresConfirmMessageSent = parsed.scoresConfirmMessageSent;
        game.processed = parsed.processed;
        game.abandoned = parsed.abandoned;
        game.abandonCountdown = parsed.abandonCountdown;
        game.cleanedUp = parsed.cleanedUp;
        game.submitCooldown = parsed.submitCooldown;
        game.pleaseStop = parsed.pleaseStop;
        game.processing = parsed.processing;
        game.working = parsed.working;
        game.finalGenTime = parsed.finalGenTime;
        game.requeueArray = this.requeueDeserializer(parsed.requeueArray);
        game.server = parsed.server == "none" ? null : dataClass.getServerById(parsed.server);
        game.acceptMessageId = parsed.acceptMessageId;
        game.autoReadied = parsed.autoReadied;
        game.initServer = parsed.initServer;
        game.serverSetup = parsed.serverSetup;
        game.joinedPlayers = this.joinedPlayersDeserializer(parsed.joinedPlayers);
        game.serverId = parsed.serverId;
        game.maps = this.mapsDeserializer(parsed.maps);
        game.votingFinished = parsed.votingFinished;
        game.usedCommunity = parsed.usedCommunity;
        game.gameStarted = parsed.gameStarted;
        console.log("Successfully loaded game")

        if (game.server) {
            void game.startOrRestartScorePolling();
        }
        return game;
    }

    public async deserializeQueueSND(data: string, client: Client, dataClass: Data): Promise<QueueController> {
        console.log("Loading Queue")
        const parsed = JSON.parse(data);
        console.log(parsed)
        const queue = new QueueController(dataClass, client, parsed.queueName);

        for (let user of parsed.inQueue) {
            queue.inQueue.push({
                dbId: Types.ObjectId.createFromHexString(user.dbId),
                discordId: user.discordId,
                queueExpire: user.queueExpire,
                mmr: user.mmr,
                name: user.name,
                region: user.region as Regions,
            });
        }

        queue.pingMe = this.pingMeDeserializer(parsed.pingMe);
        queue.generating = parsed.generating;
        queue.mapData = parsed.mapData;
        queue.locked = parsed.locked;
        console.log("Successfully loaded queue")

        return queue;
    }
}

export default new Serializer();
