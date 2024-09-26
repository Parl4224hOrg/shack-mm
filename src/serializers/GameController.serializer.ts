import {GameController} from "../controllers/GameController";
import {Collection, Client} from "discord.js";
import mongoose, {ObjectId} from "mongoose";
import tokens from "../tokens";
import {GameUser} from "../interfaces/Game";
import {Data} from "../data";
import {Regions} from "../database/models/UserModel";

class GameControllerSerializer {
    private replaceLast(toReplace: string, replaceWith: string): string {
        console.log(toReplace);
        console.log("----------------------------------------------------");
        const trimmed = toReplace.slice(0, -1);
        console.log(trimmed + replaceWith);
        return trimmed + replaceWith;
    }

    private votesSerializer(toSerialize: Collection<string, string[]>): string {
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

    public serialize(toSerialize: GameController): string {
        const alreadySerialized = ["votes", "joinedPlayers"];
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
            teamBChannelId: toSerialize.teamBChannelId,
            teamBRoleId: toSerialize.teamBRoleId,
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
            requeueArray: toSerialize.requeueArray,
            server: toSerialize.server?.id ?? "none",
            acceptMessageId: toSerialize.acceptMessageId,
            autoReadied: toSerialize.autoReadied,
            initServer: toSerialize.initServer,
            serverSetup: toSerialize.serverSetup,
            joinedPlayers: this.joinedPlayersSerializer(toSerialize.joinedPlayers),
            serverId: toSerialize.serverId,
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

    private deSerializeUsers(data: any): GameUser[] {
        const users: GameUser[] = [];
        for (let user of data) {
            users.push({
                dbId: new mongoose.Types.ObjectId(user.dbId) as any as ObjectId,
                discordId: user.discordId,
                team: user.team,
                accepted: user.accepted,
                region: user.region as Regions,
                joined: user.joined
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

    private joinedPlayersDeserializer(data: any): Set<string> {
        const newSet: Set<string> = new Set();
        for (let value of data) {
            newSet.add(value);
        }
        return newSet;
    }

    public async deserialize(data: string, client: Client, dataClass: Data): Promise<GameController> {
        const parsed = JSON.parse(data);
        
        const id = new mongoose.Types.ObjectId(parsed.id) as any as ObjectId;
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
        game.teamBChannelId = parsed.teamBChannelId;
        game.teamBRoleId = parsed.teamBRoleId;
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
        game.requeueArray = parsed.requeueArray;
        game.server = parsed.server == "none" ? null : dataClass.getServerById(parsed.server);
        game.acceptMessageId = parsed.acceptMessageId;
        game.autoReadied = parsed.autoReadied;
        game.initServer = parsed.initServer;
        game.serverSetup = parsed.serverSetup;
        game.joinedPlayers = this.joinedPlayersDeserializer(parsed.joinedPlayers);
        game.serverId = parsed.serverId;
        
        return game;
    }
}

export default new GameControllerSerializer();
