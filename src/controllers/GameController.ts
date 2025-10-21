import {Types} from "mongoose";
import {ChannelType, Client, Collection, EmbedBuilder, Guild, MessageFlagsBitField, TextChannel} from "discord.js";
import {getGameById} from "../modules/getters/getGame";
import moment from "moment/moment";
import {processMMR} from "../utility/processMMR";
import {updateGame} from "../modules/updaters/updateGame";
import {getGuildMember} from "../utility/discordGetters";
import {getAcceptPerms, getMatchPerms} from "../utility/channelPerms";
import tokens from "../tokens";
import {acceptView} from "../views/acceptView";
import {abandon, punishment} from "../utility/punishment";
import {voteA1, voteA2, voteB1, voteB2} from "../views/voteViews";
import {acceptScore, initialSubmit, initialSubmitServer} from "../views/submitScoreViews";
import {matchConfirmEmbed, matchFinalEmbed, teamsEmbed} from "../embeds/matchEmbeds";
import {GameData, InternalResponse} from "../interfaces/Internal";
import {logInfo, logWarn} from "../loggers";
import {GameUser, ids, Vote} from "../interfaces/Game";
import {updateRanks} from "../utility/ranking";
import {Data} from "../data";
import {Regions, UserInt} from "../database/models/UserModel";
import {getUserById} from "../modules/getters/getUser";
import {updateUser} from "../modules/updaters/updateUser";
import {getMapData, getMapsDB, logAccept, logScoreSubmit, logScoreAccept} from "../utility/match";
import {GameServer} from "../server/server";
import {RCONError} from "rcon-pavlov";
import {MapInt} from "../database/models/MapModel";
import LateModel from "../database/models/LateModel";
import {grammaticalTime} from "../utility/grammatical";
import {createActionUser} from "../modules/constructors/createAction";
import {Actions} from "../database/models/ActionModel";
import {RateLimitedQueue} from "../utility/rate-limited-queue";


const logVotes = async (votes: Collection<string, string[]>,
                        orderedMapList: {"1": string, "2": string, "3": string, "4": string, "5": string, "6": string, "7": string} | {"1": string, "2": string},
                        voteLabel: string, gameUsers: GameUser[], client: Client) => {
    const channel = await client.channels.fetch(tokens.GameLogChannel) as TextChannel;

    let userVotes: {
        userId: string;
        votes: string;
    }[] = [];

    for (let vote of votes) {
        let convertedMaps = "";
        for (let map of vote[1]) {
            // @ts-ignore
            convertedMaps += orderedMapList[map] + ", ";
        }
        let discordId = 'not found';
        for (let user of gameUsers) {
            if (String(user.dbId) == String(vote[0])) {
                discordId = user.discordId;
            }
        }
        userVotes.push({
            userId: `${discordId}`,
            votes: convertedMaps,
        });
    }

    const embed = new EmbedBuilder();
    embed.setTitle(`Votes for ${voteLabel}`);
    embed.setDescription("Votes:")
    for (let user of userVotes) {
        embed.addFields({
            name: user.userId,
            value: `<@${user.userId}>\n${user.votes}`,
            inline: false,
        });
    }

    await channel.send({content: `Votes for ${voteLabel}`, embeds: [embed.toJSON()]});
}

const getRandom = (votes: Vote[], lowerBound: number, upperBound: number, count: number): string[] => {
    if (count == 1) {
        return [votes[Math.floor(Math.random() * upperBound) + lowerBound].id]
    }
    let i1 = Math.floor(Math.random() * upperBound) + lowerBound
    let i2 = Math.floor(Math.random() * upperBound) + lowerBound


    while (i1 == i2) {
        i2 = Math.floor(Math.random() * upperBound) + lowerBound
    }

    if (count == 3) {
        let i3 = Math.floor(Math.random() * upperBound) + lowerBound
        while (i1 == i3 || i2 == i3) {
            i3 = Math.floor(Math.random() * upperBound) + lowerBound
        }
        return [votes[i1].id, votes[i2].id, votes[i3].id]
    } else {
        return [votes[i1].id, votes[i2].id]
    }
}

const getPreviousVotes = (userVotes: string[], maps: any) => {
    let str = '';
    for (let vote of userVotes) {
        str += ` ${maps[vote]}`
    }
    return str;
}

export class GameController {
    readonly id: Types.ObjectId;
    readonly matchNumber: number;
    readonly client: Client;
    readonly guild: Guild;
    tickCount: number = 0;
    state: number = 0;
    users: GameUser[] = [];
    readonly queueId: string = '';
    readonly scoreLimit: number = 0;
    startTime;
    readonly data: Data;

    acceptChannelGen = false;
    acceptChannelId = '';
    matchRoleId = '';
    acceptCountdown = 180;

    voteChannelsGen = false;
    teamAChannelId = '';
    teamARoleId = '';
    teamBChannelId = '';
    teamBRoleId = '';
    voteA1MessageId = '';
    voteB1MessageId = '';
    voteA2MessageId = '';
    voteB2MessageId = '';
    voteCountdown = tokens.VoteTime;
    votes: Collection<string, string[]> = new Collection<string, string[]>();
    mapSet = {
        '1': "",
        '2': "",
        '3': "",
        '4': "",
        '5': "",
        '6': "",
        '7': "",
    }
    sideSet = {
        '1': "CT",
        '2': "T"
    }
    currentMaxVotes = 3;
    allBans: string[] = [];

    map: string = '';
    mapData: MapInt | null = null;
    sides = ['', ''];

    finalChannelGen = false;
    finalChannelId = '';

    scores = [-1, -1];
    scoresAccept = [false, false];
    scoresConfirmMessageSent = false;
    processed = false;

    abandoned = false;
    abandonCountdown = 30;
    cleanedUp = false;

    submitCooldown = 600;
    pleaseStop = false;

    processing = false;

    working = false;

    finalGenTime = 0;

    requeueArray: Types.ObjectId[] = [];

    server: GameServer | null;

    acceptMessageId: string = "";

    autoReadied = false;

    initServer = false;

    serverSetup = true;

    joinedPlayers: Set<string> = new Set();

    serverId: string;
    firstTick = false;
    maps: MapInt[] = [];
    votingFinished = false;

    minutesPassed = 0;
    halfMinutesPassed = 0;

    constructor(id: Types.ObjectId, client: Client, guild: Guild, matchNumber: number, teamA: ids[], teamB: ids[], queueId: string, scoreLimit: number, data: Data, server: GameServer | null) {
        this.id = id;
        this.client = client;
        this.guild = guild;
        this.matchNumber = matchNumber
        this.queueId = queueId;
        this.scoreLimit = scoreLimit;
        for (let user of teamA) {
            this.users.push({
                dbId: user.db,
                discordId: user.discord,
                team: 0,
                accepted: false,
                region: user.region,
                joined: false,
                isLate: false,
                hasBeenGivenLate: false,
            });
        }
        for (let user of teamB) {
            this.users.push({
                dbId: user.db,
                discordId: user.discord,
                team: 1,
                accepted: false,
                region: user.region,
                joined: false,
                isLate: false,
                hasBeenGivenLate: false,
            });
        }
        this.data = data;
        this.startTime = moment().unix();

        this.server = server;

        if (this.server) {
            this.initServer = true;
            this.serverId = server!.id;
        } else {
            this.serverId = ""
        }
        this.firstTick = true;
    }

    async load(data: any) {
        this.tickCount = data.tickCount;
        this.state = data.state;
        this.users = data.users;
        this.startTime = data.startTime;

        this.acceptChannelGen = data.acceptChannelGen;
        this.acceptChannelId = data.acceptChannelId;
        this.matchRoleId = data.matchRoleId;
        this.acceptCountdown = data.acceptCountdown;

        this.voteChannelsGen = data.voteChannelsGen;
        this.teamAChannelId = data.teamAChannelId;
        this.teamARoleId = data.teamARoleId;
        this.teamBChannelId = data.teamBChannelId;
        this.teamBRoleId = data.teamBRoleId;
        this.voteA1MessageId = data.voteA1MessageId;
        this.voteB1MessageId = data.voteB1MessageId;
        this.voteA2MessageId = data.voteA2MessageId;
        this.voteB2MessageId = data.voteB2MessageId;
        this.voteCountdown = data.voteCountdown;

        this.mapSet = data.mapSet;
        this.sideSet = data.sideSet;
        this.currentMaxVotes = data.currentMaxVotes;
        this.allBans = data.allBans;

        this.map = data.map;
        this.sides = data.sides;

        this.finalChannelGen = data.finalChannelGen;
        this.finalChannelId = data.finalChannelId;

        this.scores = data.scores;
        this.scoresAccept = data.scoresAccept;
        this.scoresConfirmMessageSent = data.scoresConfirmMessageSent;
        this.processed = data.processed;

        this.abandoned = data.abandoned;
        this.cleanedUp = data.cleanedUp;

        this.submitCooldown = data.submitCooldown;
        this.pleaseStop = data.pleaseStop;

        this.processing = data.processing;
        this.working = data.working;
        this.finalGenTime = data.finalGenTime;

        logInfo('[GameController.load] called with data.requeueArray: ' + JSON.stringify(data.requeueArray) + ', types: ' + JSON.stringify(data.requeueArray && data.requeueArray.map((x: any) => typeof x)), this.client);
        this.requeueArray = [];
        for (let requeue of data.requeueArray) {
            const objId = Types.ObjectId.createFromHexString(requeue);
            logInfo('[GameController.load] pushing ObjectId: ' + objId + ', from: ' + requeue + ', type: ' + typeof requeue, this.client);
            this.requeueArray.push(objId);
        }
        logInfo('[GameController.load] final this.requeueArray: ' + JSON.stringify(this.requeueArray) + ', types: ' + JSON.stringify(this.requeueArray.map((x: any) => typeof x)), this.client);


        this.acceptMessageId = data.acceptMessageId;

        this.autoReadied = data.autoReadied ?? false

        this.serverId = data.serverInUse ?? "";
        this.maps = data.maps;
        this.votingFinished = data.votingFinished;
    }

    async tick() {
        try {
            if (this.firstTick) {
                this.firstTick = false;
                this.maps = await getMapsDB();
                let i = 1;
                for (let map of this.maps) {
                    this.mapSet[String(i) as "1" | "2" | "3" | "4" | "5" | "6" | "7"] = map.name;
                    i++;
                }
            }
            if (this.initServer) {
                this.initServer = false;
                await this.server!.registerServer(this.matchNumber);
            }
            this.tickCount++;
            this.voteCountdown--;
            switch (this.state) {
                case 0:
                    await this.acceptPhase();
                    break;
                case 1:
                    await this.voteA1();
                    break;
                case 2:
                    await this.voteB1();
                    break;
                case 3:
                    await this.voteA2();
                    break;
                case 4:
                    await this.voteB2();
                    break;
                case 5:
                    await this.matchTick();
                    break;
                case 6:
                    await this.confirmScoreSubmit();
                    break;
                case 7:
                    await this.processMatch();
                    break;
                default:
                    if (this.abandoned && this.abandonCountdown <= 0 && !this.cleanedUp) {
                        await this.abandonCleanup(false, this.data.getQueue().getDeleteQueue());
                    } else if (this.abandoned) {
                        this.abandonCountdown--;
                    }
            }
        } catch (e) {
            console.error(e);
        }
    }

    async SendMinutesLeft(minutesLeft: number) {
        const channel = await this.client.channels.fetch(this.finalChannelId) as TextChannel;
        await channel.send(`**__${minutesLeft} minutes left to join!__**`);
    }

    async sendNotJoinedMessage(minutesLeft: number) {
        const channel = await this.client.channels.fetch(this.finalChannelId) as TextChannel;
        const lateUserMentions: string[] = [];
        for (let user of this.users) {
            const dbUser = await getUserById(user.dbId, this.data);
            if (dbUser && ![...this.joinedPlayers].some(jp => jp.toLowerCase() === dbUser.oculusName.toLowerCase())) {
                const logChannel = await this.client.channels.fetch(tokens.LogChannel) as TextChannel;
                await logChannel.send(`User ${dbUser.oculusName} is late.`);
                lateUserMentions.push(`<@${user.discordId}>`);
            }
        }
        await channel.send(`Warning: ${lateUserMentions.join(', ')} you have ${minutesLeft} minute/s left to join or you will receive a cooldown.`);
    }

    async doHalfMinuteTick(time: number, minutesPassed: number) {
        const halfMinutesPassed = Math.floor((time - this.finalGenTime) / 30); // Every 30 seconds
        if (halfMinutesPassed <= this.halfMinutesPassed) {
            return;
        }
        this.halfMinutesPassed = halfMinutesPassed;

        //Every 30 seconds check server for players
        if (minutesPassed >= 5) {
            await this.updateJoinedPlayers();
        }

        // Every 30 seconds after 5 minutes
        if (this.server && minutesPassed >= 5) {
            for (let gameUser of this.users.filter(user => user.isLate && !user.hasBeenGivenLate)) {
                const dbUser = await getUserById(gameUser.dbId, this.data);
                const found = await LateModel.findOne({user: dbUser.id, matchId: this.matchNumber});
                if (!found) {
                    await LateModel.create({
                        user: gameUser.discordId,
                        oculusName: dbUser.oculusName,
                        joinTime: moment().unix(),
                        channelGenTime: this.finalGenTime,
                        matchId: this.matchNumber,
                    });
                } else {
                    found.joinTime = moment().unix();
                    await found.save();
                }
            }
            const RefreshList = await this.server.refreshList();
            const channel = await this.guild.channels.fetch(this.finalChannelId) as TextChannel;
            for (let user of RefreshList.PlayerList) {
                for (let gameUser of this.users.filter(user => user.isLate && !user.hasBeenGivenLate)) {
                    let dbUser = await getUserById(gameUser.dbId, this.data);
                    if (user.UniqueId && dbUser.oculusName && user.UniqueId.toLowerCase() === dbUser.oculusName.toLowerCase()) {
                        gameUser.hasBeenGivenLate = true;
                    }
                }
            }
            if (RefreshList.PlayerList.length > 0) {
                for (const user of this.users.filter(user => user.isLate && !user.hasBeenGivenLate)) {
                    await channel.send(`<@${user.discordId}> has not yet joined`);
                }
            }
        }
    }

    async matchTick() {
        const time = moment().unix();
        const minutesPassed = Math.floor((time - this.finalGenTime) / 60);

        await this.doHalfMinuteTick(time, minutesPassed);

        if (minutesPassed <= this.minutesPassed) {
            return;
        }
        this.minutesPassed = minutesPassed;
        this.submitCooldown--;

        if (minutesPassed < 5) {
            await this.SendMinutesLeft(5 - minutesPassed);
        }

        // 2 Minutes left
        if (minutesPassed == 3) {
            await this.sendNotJoinedMessage(2);
        }

        // 1 minute left
        if (minutesPassed == 4) {
            await this.sendNotJoinedMessage(1);
        }

        // 5 minutes passed
        if (minutesPassed == 5) {
            await this.updateJoinedPlayers();
            const channel = await this.client.channels.fetch(this.finalChannelId) as TextChannel;
            const lateUsers: GameUser[] = [];
            if (this.serverSetup) {
                for (let user of this.users) {
                    const dbUser = await getUserById(user.dbId, this.data);
                    if (dbUser && ![...this.joinedPlayers].some(jp => jp.toLowerCase() === dbUser.oculusName.toLowerCase())) {
                        const logChannel = await this.client.channels.fetch(tokens.LogChannel) as TextChannel;
                        await logChannel.send(`User ${dbUser.oculusName} is late.`);
                        lateUsers.push(user);
                        user.isLate = true;
                    }
                }
            }
            await channel.send("5 minutes have passed");
            const logChannel = await this.client.channels.fetch(tokens.LogChannel) as TextChannel;
            await logChannel.send(`Game controller line 346, serverSetup value: ${this.serverSetup}`);
            if (tokens.ApplyLates && this.serverSetup) {
                if (lateUsers.length > 0 && lateUsers.length < 7) {
                    for (let user of lateUsers) {
                        let dbUser = await getUserById(user.dbId, this.data);
                        const lates = await LateModel.find({user: dbUser.id});
                        let totalTime = 0;
                        for (const late of lates) {
                            // Subtract 60 seconds times 5 minutes to account for allowed join time
                            totalTime += (late.joinTime - late.channelGenTime) - 5 * 60;
                        }
                        const avgLateTime = totalTime / lates.length;
                        const latePercent = (lates.length / (dbUser.gamesPlayedSinceLates + 1)) * 100;
                        const latePercentNeeded = 53.868 * Math.exp(-0.00402 * avgLateTime);
                        if (latePercent >= latePercentNeeded) {
                            if (tokens.ApplyNewLates) {
                                const now = moment().unix();
                                dbUser = await punishment(dbUser, this.data, false, 1, now);
                                await createActionUser(Actions.Cooldown, tokens.ClientID, dbUser.id, "Auto Cooldown for being late to match " + this.matchNumber, `Cooldown for ${grammaticalTime(dbUser.banUntil - now)}, late ${latePercent}% with average time ${avgLateTime} seconds`)
                                await channel.send(`<@${dbUser.id}> has been cooldowned for ${grammaticalTime(dbUser.banUntil - now)} for being late`)

                                // Send message to general channel for cooldown
                                const generalChannel = await this.client.channels.fetch(tokens.GeneralChannel) as TextChannel;
                                await generalChannel.send(`<@${dbUser.id}> has been cooldowned for ${grammaticalTime(dbUser.banUntil - now)} for being late to match ${this.matchNumber}. Late ${latePercent}% with average time ${avgLateTime} seconds`);
                            } else {
                                await logChannel.send(`<@${dbUser.id}> should receive a cooldown for being late, but applying lates is disabled\nLate %: ${latePercent}\nLate Avg: ${avgLateTime}`)
                                await channel.send(`<@${user.discordId}> has been given a late`);
                            }
                        } else {
                            await channel.send(`<@${user.discordId}> has been given a late`);
                        }
                    }
                }
            } else {
                await channel.send("Assuming lobby is being used no lates are being applied");
            }
        }

        // 10 minutes passed
        if (minutesPassed == 10) {
            const channel = await this.client.channels.fetch(this.finalChannelId) as TextChannel;
            await channel.send("10 minutes have passed");
        }

        // Every Minute check for players and swap teams
        if (this.server) {
            const dbUsers: UserInt[] = [];
            for (let user of this.users) {
                dbUsers.push(await getUserById(user.dbId, this.data));
            }
            try {
                const RefreshList = await this.server.refreshList()
                if (RefreshList.PlayerList) {
                    for (let user of RefreshList.PlayerList) {
                        let found = false;
                        for (let dbUser of dbUsers) {
                            if (dbUser.oculusName && user.UniqueId && dbUser.oculusName.toLowerCase() === user.UniqueId.toLowerCase()) {
                                found = true;
                                const playerInfo = await this.server.inspectPlayer(user.UniqueId);
                                for (let gameUser of this.users) {
                                    try {
                                        if (gameUser.discordId == dbUser.id) {
                                            gameUser.joined = true;
                                            if (playerInfo.PlayerInfo.TeamId == '0') {
                                                // Player is on CT
                                                if (gameUser.team == 0 && this.sides[0] == "T") {
                                                    await this.server.switchTeam(user.UniqueId, "1");
                                                }
                                                if (gameUser.team == 1 && this.sides[1] == "T") {
                                                    await this.server.switchTeam(user.UniqueId, "1");
                                                }
                                            } else {
                                                // Player is on T
                                                if (gameUser.team == 0 && this.sides[0] == "CT") {
                                                    await this.server.switchTeam(user.UniqueId, "0");
                                                }
                                                if (gameUser.team == 1 && this.sides[1] == "CT") {
                                                    await this.server.switchTeam(user.UniqueId, "0");
                                                }
                                            }
                                        }
                                    } catch (e) {
                                        if (e instanceof RCONError) {
                                            await logWarn(`RCON Error: ${e.name} : ${e.message}`, this.client);
                                        }
                                    }
                                }
                            }
                        }
                        try {
                            if (!found) {
                                await this.server.kick(user.UniqueId);
                            }
                        } catch (e) {
                            if (e instanceof RCONError) {
                                await logWarn(`RCON Error: ${e.name} : ${e.message}`, this.client);
                            }
                        }
                        // 1 is T 0 is CT

                    }
                } else {
                    await logWarn("Player list is empty", this.client);
                }
            } catch (e) {
                if (e instanceof RCONError) {
                    await logWarn(`RCON Error: ${e.name} : ${e.message}`, this.client);
                }
            }
        }
    }

    async updateJoinedPlayers() {
        const playerList = await this.server?.refreshList();
        if (playerList && playerList.PlayerList) {
            for (let player of playerList.PlayerList) {
                this.joinedPlayers.add(player.UniqueId.toLowerCase());
            }
        }
        const logChannel = await this.client.channels.fetch(tokens.LogChannel) as TextChannel;
        const joinedPlayersList = Array.from(this.joinedPlayers).join(', ');
        await logChannel.send(`Current joined players: ${joinedPlayersList}`);
    }

    async switchMap() {
        await this.server!.switchMap(this.mapData!.ugc, "SND");
        await this.server!.updateServerName(`SMM Match-${this.matchNumber}`);
    }

    async processMatch() {
        try {
            this.state = 8;

            const channel = await this.guild.channels.fetch(this.finalChannelId) as TextChannel;
            await channel.send({content: "Scores have been accepted"});

            const gameTemp = await getGameById(this.id);
            const game = gameTemp!;
            game.map = this.map;
            game.scoreA = this.scores[0];
            game.scoreB = this.scores[1];
            game.endDate = moment().unix();
            if (game.scoreA == 10) {
                game.winner = 0;
            } else if (game.scoreB == 10) {
                game.winner = 1;
            } else {
                game.winner = -1;
            }
            if (!this.processing && !this.processed) {
                this.processing = true;
                const changes = await processMMR(this.users, this.scores, this.queueId, this.scoreLimit);
                game.teamAChanges = changes[0];
                game.teamBChanges = changes[1];

                await updateGame(game);

                this.processed = true;

                for (let user of this.users) {
                    const dbUser = await getUserById(user.dbId, this.data);
                    dbUser.gamesPlayedSinceReductionAbandon++;
                    dbUser.gamesPlayedSinceReductionFail++;
                    dbUser.gamesPlayedSinceLates++;
                    await updateUser(dbUser, this.data);
                }

                await updateRanks(this.users, this.client);
                this.processing = false
            }
        } catch (e) {
            console.error(e);
        }
    }

    async acceptPhase() {
        this.acceptCountdown--;
        if (!this.acceptChannelGen) {
            this.acceptChannelGen = true;
            const matchRole = await this.guild.roles.create({
                name: `match-${this.matchNumber}`,
                reason: 'Create role for match accept',
            });
            this.matchRoleId = matchRole.id;

            for (let user of this.users) {
                const member = await getGuildMember(user.discordId, this.guild);
                await member.roles.add(matchRole);
            }

            const acceptChannel = await this.guild.channels.create({
                name: `match-${this.matchNumber}`,
                type: ChannelType.GuildText,
                permissionOverwrites: getAcceptPerms(matchRole),
                position: 0,
                parent: tokens.MatchCategory,
                reason: 'Create channel for match accept'
            });

            this.acceptChannelId = acceptChannel.id;

            for (let user of this.users) {
                const member = await getGuildMember(user.discordId, this.guild);
                if (!member.dmChannel) {
                    await member.createDM(true);
                }
                const dbUser = await getUserById(user.dbId, this.data);
                if (dbUser.dmMatch) {
                    try {
                        await member.dmChannel!.send(`A game has started please accept the game here ${acceptChannel.url} within 3 minutes`);
                    } catch (e) {
                        await logWarn(`Could not dm user -${dbUser.id}`, this.client);
                    }
                }
            }

            const message = await acceptChannel.send({content: `${matchRole.toString()} ${tokens.AcceptMessage}`, components: [acceptView()]});
            await message.pin();
            this.acceptMessageId = message.id;
        }
        let accepted = true;
        for (let user of this.users) {
            if (!user.accepted) {
                accepted = false;
                break;
            }
        }
        if (accepted) {
            this.state++;
        }



        if (this.acceptCountdown == 60) {
            const acceptChannel = await this.client.channels.fetch(this.acceptChannelId) as TextChannel
            for (let user of this.users) {
                if (!user.accepted) {
                    await acceptChannel.send({content: `<@${user.discordId}> you have 1 minute accept the match`})
                }
            }
        }

        if (this.acceptCountdown <= 0 && !this.abandoned && !this.pleaseStop) {
            this.pleaseStop = true;
            const acceptChannel = await this.client.channels.fetch(this.acceptChannelId) as TextChannel
            const message = await acceptChannel.messages.fetch(this.acceptMessageId);
            await message.edit({content: message.content, components: []});
            const newUsers: GameUser[] = [];
            for (let user of this.users) {
                if (!user.accepted) {
                    await this.abandon(user, true, true);
                } else {
                    newUsers.push(user);
                }
            }
            await this.data.addAbandoned(newUsers);
        }
    }

    hasChannel(id: string) {
        return this.acceptChannelId == id || this.finalChannelId == id || this.teamAChannelId == id || this.teamBChannelId == id;
    }

    async abandon(user: GameUser, acceptFail: boolean, forced: boolean = false) {
        let validAbandon = true;
        if (this.server) {
            try {
                // const serverInfo = await this.server.serverInfo()
                try {
                    //if (Number(serverInfo.ServerInfo.Team0Score) >= 6 || Number(serverInfo.ServerInfo.Team1Score) >= 6) {
                        //validAbandon = false;
                    //}
                } catch (e) {
                    if (e instanceof TypeError) {
                        validAbandon = true;
                    }
                    await logWarn("Score returned by server nonexistent", this.client);
                }
            }
            catch (e) {
                await logWarn(`${e}`, this.client);
            }
        }
        if (validAbandon || forced) {
            this.abandoned = true;
            this.abandonCountdown = tokens.AbandonTime;
            // For punishment purposes, treat accept phase abandons as fail-to-accept
            const isAcceptPhaseAbandon = this.state === 0;
            const punishmentAcceptFail = acceptFail || isAcceptPhaseAbandon;

            this.server?.unregisterServer();
            this.server = null;

            await logInfo(`abandon() - User ${user.discordId} abandoning. State: ${this.state}, acceptFail: ${acceptFail}, isAcceptPhaseAbandon: ${isAcceptPhaseAbandon}, punishmentAcceptFail: ${punishmentAcceptFail}`, this.client);
            
            if (this.state < 10) {
                this.state += 10;
            }
            
            await abandon(user.dbId, user.discordId, this.guild, punishmentAcceptFail, this.data, this.matchNumber);
            await this.sendAbandonMessage(user.discordId);
            
            const shouldAutoReady = !acceptFail && (this.finalGenTime + 15 * 60 >= moment().unix() || !this.votingFinished);
            await logInfo(
                `abandon() - AutoReady check: acceptFail=${acceptFail}, finalGenTime=${this.finalGenTime}, timeCheck=${this.finalGenTime + 15 * 60 >= moment().unix()}, votingFinished=${this.votingFinished}, shouldAutoReady=${shouldAutoReady}`,
                this.client
            );
            
            if (shouldAutoReady) {
                this.autoReadied = true;
                const temp: GameUser[] = [];
                await logInfo(`abandon() - Avoiding user with discordId: ${user.discordId}`, this.client);
                for (let userCheck of this.users) {
                    if (!(user.discordId == userCheck.discordId)) {
                        temp.push(userCheck);
                    }
                }
                await logInfo(`autorequeue - temp array after filtering: [${temp.map(u => u.discordId).join(', ')}]`, this.client);
                await this.data.addAbandoned(temp);
            }
            return true;
        } else {
            return false;
        }
    }

    async calcVotes(state: number): Promise<string[]> {
        let one: Vote = {total: 0, id: '1'};
        let two: Vote = {total: 0, id: '2'};
        let three: Vote = {total: 0, id: '3'};
        let four: Vote = {total: 0, id: '4'};
        let five: Vote = {total: 0, id: '5'};
        let six: Vote = {total: 0, id: '6'};
        let seven: Vote = {total: 0, id: '7'};

        for (let vote of this.votes.values()) {
            for (let subVote of vote) {
                switch (subVote) {
                    case '1':
                        one.total++;
                        break;
                    case '2':
                        two.total++;
                        break;
                    case '3':
                        three.total++;
                        break;
                    case '4':
                        four.total++;
                        break;
                    case '5':
                        five.total++;
                        break;
                    case '6':
                        six.total++;
                        break;
                    case '7':
                        seven.total++;
                        break;
                }
            }
        }

        let mapVotes = [one, two, three, four, five, six, seven];

        let voteLabel = `Match ${this.matchNumber}: `;

        if (state == 2) {
            voteLabel += "Team A, Ban Three";
        } else if (state == 3) {
            voteLabel += "Team B, Ban Two";
        } else if (state == 4) {
            voteLabel += "Team A, Select One";
        } else if (state == 5) {
            voteLabel += "Team B, Select One";
        }

        await logVotes(this.votes, state <= 4 ? this.mapSet : this.sideSet, voteLabel, this.users, this.client);

        mapVotes = mapVotes.sort((a, b) => b.total-a.total);
        let randomRange;
        let bans: string[];

        if (state == 2) {
            if (mapVotes[2].total == mapVotes[3].total) {
                if (mapVotes[3].total == mapVotes[4].total) {
                    if (mapVotes[4].total == mapVotes[5].total) {
                        if (mapVotes[5].total == mapVotes[6].total) {
                            randomRange = 4
                        } else {
                            randomRange = 3;
                        }
                    } else {
                        randomRange = 2;
                    }
                } else {
                    randomRange = 1;
                }
            } else {
                randomRange = 0;
            }

            if (randomRange == 0) {
                bans = [mapVotes[0].id, mapVotes[1].id, mapVotes[2].id];
            } else if (randomRange == 1) {
                bans = [mapVotes[0].id, mapVotes[1].id].concat(getRandom(mapVotes, 2, 3, 1));
            } else if (randomRange == 2) {
                if (mapVotes[0].total == mapVotes[1].total && mapVotes[1].total != mapVotes[2].total) {
                    bans = [mapVotes[0].id, mapVotes[1].id].concat(getRandom(mapVotes, 2, 3, 1));
                } else {
                    bans = [mapVotes[0].id].concat(getRandom(mapVotes, 1, 4, 2));
                }
            } else {
                bans = getRandom(mapVotes, 0, randomRange + 3, 3);
            }
        }
        else if (state == 3) {
            if (mapVotes[1].total == mapVotes[2].total) {
                if (mapVotes[2].total == mapVotes[3].total) {
                    randomRange = 2;
                } else {
                    randomRange = 1;
                }
            } else {
                randomRange = 0;
            }

            if (randomRange == 0) {
                bans = [mapVotes[0].id, mapVotes[1].id]
            } else if (randomRange == 1) {
                if (mapVotes[1].total == mapVotes[2].total && mapVotes[2].total == mapVotes[3].total) {
                    bans = [mapVotes[0].id].concat(getRandom(mapVotes, 1, 3, 1));
                } else {
                    bans = [mapVotes[0].id].concat(getRandom(mapVotes, 1, 2, 1));
                }
            } else {
                if (mapVotes[1].total == mapVotes[2].total && mapVotes[2].total == mapVotes[3].total) {
                    bans = getRandom(mapVotes, 0, 3, 2);
                } else {
                    bans = getRandom(mapVotes, 0, 2, 2);
                }
            }
        }
        else if (state == 4){
            if (mapVotes[0].total == mapVotes[1].total) {
                bans = getRandom(mapVotes, 0, 2, 1);
            } else {
                bans = [mapVotes[0].id];
            }
        }
        else {
            if (mapVotes[0].total == mapVotes[1].total) {
                bans = getRandom(mapVotes, 0, 2, 2);
            } else {
                bans = [mapVotes[0].id, mapVotes[1].id];
            }
        }

        let newMaps: string[] = [];


        let convertedBans = [];
        for (let ban of bans) {
            if (state > 4) {
                convertedBans.push(this.sideSet[ban as '1' | '2'])
                newMaps = ["CT", "T"];
            } else {
                convertedBans.push(this.mapSet[ban as '1' | '2' | '3' | '4' | '5' | '6' | '7'])
            }
        }

        for (let ban of convertedBans) {
            this.allBans.push(ban)
        }


        if (state <= 4) {
            for (let map of this.maps) {
                if (!this.allBans.includes(map.name)) {
                    newMaps.push(map.name);
                }
            }
        }

        if (state == 2) {
            this.mapSet = {
                '1': newMaps[0],
                '2': newMaps[1],
                '3': newMaps[2],
                '4': newMaps[3],
                '5': "",
                '6': "",
                '7': "",
            }
        } else if (state == 3) {
            this.mapSet = {
                '1': newMaps[0],
                '2': newMaps[1],
                '3': "",
                '4': "",
                '5': "",
                '6': "",
                '7': "",
            }
        } else if (state == 4){
            this.mapSet = {
                '1': newMaps[0],
                '2': newMaps[1],
                '3': "",
                '4': "",
                '5': "",
                '6': "",
                '7': "",
            }
        } else {
            this.sideSet = {
                '1': newMaps[0],
                '2': newMaps[1],
            }
        }
        this.state = state;
        this.voteCountdown = tokens.VoteTime;
        this.votes.clear();

        return convertedBans;
    }

    async voteA1() {
        if (!this.voteChannelsGen) {
            this.voteChannelsGen = true;
            this.working = true;

            await logInfo(`Starting vote channel gen\nState: ${this.state}\nVoteCountdown: ${this.voteCountdown}\nTickCount: ${this.tickCount}\nBanned: ${this.allBans}\nMaps: ${this.mapSet}`, this.client);
            
            const teamARole = await this.guild.roles.create({
                name: `team-a-${this.matchNumber}`,
                reason: 'Create role for team a'
            });
            this.teamARoleId = teamARole.id;

            const teamBRole = await this.guild.roles.create({
                name: `team-b-${this.matchNumber}`,
                reason: 'Create role for team b'
            });        
            this.teamBRoleId = teamBRole.id;

            for (let user of this.users) {
                const member = await getGuildMember(user.discordId, this.guild);
                if (user.team == 0) {
                    await member.roles.add(teamARole)
                } else {
                    await member.roles.add(teamBRole)
                }
            }

            const teamAChannel = await this.guild.channels.create({
                    name: `team-a-${this.matchNumber}`,
                    type: ChannelType.GuildText,
                    permissionOverwrites: getMatchPerms(teamARole),
                    position: 0,
                    parent: tokens.MatchCategory,
                    reason: 'Create channel for team a'
                }
            );
            this.teamAChannelId = teamAChannel.id;

            const teamBChannel = await this.guild.channels.create({
                    name: `team-b-${this.matchNumber}`,
                    type: ChannelType.GuildText,
                    permissionOverwrites: getMatchPerms(teamBRole),
                    position: 0,
                    parent: tokens.MatchCategory,
                    reason: 'Create channel for team a'
                }
            );
            this.teamBChannelId = teamBChannel.id;

            let teamAStr = "";
            let teamBStr = "";
            for (let player of this.users) {
                if (player.team == 0) {
                    teamAStr += `<@${player.discordId}> `;
                } else {
                    teamBStr += `<@${player.discordId}> `;
                }
            }

            const teamAMessage = await teamAChannel.send({
                components: voteA1(this.mapSet["1"], 0, this.mapSet["2"], 0, this.mapSet["3"], 0, this.mapSet["4"],
                    0, this.mapSet["5"], 0, this.mapSet["6"], 0, this.mapSet["7"], 0),
                content: `Team A - ${teamAStr}Please ban three maps`});
            this.voteA1MessageId = teamAMessage.id;

            await teamBChannel.send({content: `Team B - ${teamBStr}Team A is banning 3 maps`});

            this.voteCountdown = tokens.VoteTime;

            const acceptChannel = await this.guild.channels.fetch(this.acceptChannelId);
            await acceptChannel?.delete();
            this.working = false;
            await logInfo(`Finished vote channel gen\nState: ${this.state}\nVoteCountdown: ${this.voteCountdown}\nTickCount: ${this.tickCount}\nBanned: ${this.allBans}\nMaps: ${this.mapSet}`, this.client);
        }
        if (this.voteCountdown <= 0 && !this.working) {
            this.working = true;
            await logInfo(`Started vote A1 calc\nState: ${this.state}\nVoteCountdown: ${this.voteCountdown}\nTickCount: ${this.tickCount}\nBanned: ${this.allBans}\nMaps: ${this.mapSet}`, this.client);
            const bans = await this.calcVotes(2);
            const teamAChannel = await this.client.channels.fetch(this.teamAChannelId) as TextChannel;
            const teamBChannel = await this.client.channels.fetch(this.teamBChannelId) as TextChannel;

            const teamA1Message = await teamAChannel.messages.fetch(this.voteA1MessageId)
            await teamA1Message.edit({content: `~~${teamA1Message.content}~~ Voting has ended`, components: []});

            this.currentMaxVotes = 2;

            await teamAChannel.send({content: `${bans[0]}, ${bans[1]}, and ${bans[2]} banned`});
            await teamBChannel.send({content: `Team A banned ${bans[0]}, ${bans[1]}, and ${bans[2]}`});
            const banMessage = await teamBChannel.send({content: "Please ban two maps",
                components: [voteB1(this.mapSet["1"], 0, this.mapSet["2"], 0, this.mapSet["3"], 0, this.mapSet["4"], 0)]});
            this.voteB1MessageId = banMessage.id;
            this.working = false;
            await logInfo(`Ended vote A1 calc\nState: ${this.state}\nVoteCountdown: ${this.voteCountdown}\nTickCount: ${this.tickCount}\nBanned: ${this.allBans}\nMaps: ${this.mapSet}`, this.client);
        }
    }

    async voteB1() {
        if (this.voteCountdown <= 0 && !this.working) {
            this.working = true;
            await logInfo(`Started vote B1 calc\nState: ${this.state}\nVoteCountdown: ${this.voteCountdown}\nTickCount: ${this.tickCount}\nBanned: ${this.allBans}\nMaps: ${this.mapSet}`, this.client);
            const bans = await this.calcVotes(3);
            const teamAChannel = await this.client.channels.fetch(this.teamAChannelId) as TextChannel;
            const teamBChannel = await this.client.channels.fetch(this.teamBChannelId) as TextChannel;

            const teamB1Message = await teamBChannel.messages.fetch(this.voteB1MessageId)
            await teamB1Message.edit({content: `~~${teamB1Message.content}~~ Voting has ended`, components: []});

            this.currentMaxVotes = 1;

            await teamBChannel.send({content: `${bans[0]} and ${bans[1]} banned`});
            await teamAChannel.send({content: `Team B banned ${bans[0]} and ${bans[1]}`});
            const banMessage = await teamAChannel.send({content: "Please select a map",
                components: [voteA2(this.mapSet["1"], 0, this.mapSet["2"], 0)]});
            this.voteA2MessageId = banMessage.id;
            this.working = false;
            await logInfo(`Ended vote B1 calc\nState: ${this.state}\nVoteCountdown: ${this.voteCountdown}\nTickCount: ${this.tickCount}\nBanned: ${this.allBans}\nMaps: ${this.mapSet}`, this.client);
        }
    }

    async voteA2() {
        if (this.voteCountdown <= 0 && !this.working) {
            this.working = true;
            await logInfo(`Started vote A2 calc\nState: ${this.state}\nVoteCountdown: ${this.voteCountdown}\nTickCount: ${this.tickCount}\nBanned: ${this.allBans}\nMaps: ${this.mapSet}`, this.client);
            const bans = await this.calcVotes(4);
            const teamAChannel = await this.client.channels.fetch(this.teamAChannelId) as TextChannel;
            const teamBChannel = await this.client.channels.fetch(this.teamBChannelId) as TextChannel;

            const teamA2Message = await teamAChannel.messages.fetch(this.voteA2MessageId)
            await teamA2Message.edit({content: `~~${teamA2Message.content}~~ Voting has ended`, components: []});

            this.map = bans[0];
            this.mapData = await getMapData(this.map);

            await teamAChannel.send({content: `Selected ${bans[0]}`});
            await teamBChannel.send({content: `Team A selected ${bans[0]}`});
            const banMessage = await teamBChannel.send({content: "Please select a side",
                components: [voteB2(this.sideSet["1"], 0, this.sideSet["2"], 0)]});
            this.voteB2MessageId = banMessage.id;
            this.working = false;
            await logInfo(`Ended vote A2 calc\nState: ${this.state}\nVoteCountdown: ${this.voteCountdown}\nTickCount: ${this.tickCount}\nBanned: ${this.allBans}\nMaps: ${this.mapSet}`, this.client);
        }
    }

    async voteB2() {
        if (this.voteCountdown <= 0 && !this.finalChannelGen) {
            this.finalChannelGen = true;
            await logInfo(`Started vote B2 calc\nState: ${this.state}\nVoteCountdown: ${this.voteCountdown}\nTickCount: ${this.tickCount}\nBanned: ${this.allBans}\nMaps: ${this.mapSet}`, this.client);
            const bans = await this.calcVotes(5);
            const teamAChannel = await this.client.channels.fetch(this.teamAChannelId) as TextChannel;
            const teamBChannel = await this.client.channels.fetch(this.teamBChannelId) as TextChannel;

            const teamB2Message = await teamBChannel.messages.fetch(this.voteB2MessageId)
            await teamB2Message.edit({content: `~~${teamB2Message.content}~~ Voting has ended`, components: []});

            this.sides = [bans[1], bans[0]];

            await logInfo(`Ended vote B2 calc\nState: ${this.state}\nVoteCountdown: ${this.voteCountdown}\nTickCount: ${this.tickCount}\nBanned: ${this.allBans}\nMaps: ${this.mapSet}`, this.client);

            await teamAChannel.send({content: `Selected ${bans[0]}`});
            await teamBChannel.send({content: `Team B selected ${bans[0]}`});

            const finalChannel = await this.guild.channels.create({
                name: `match-${this.matchNumber}`,
                type: ChannelType.GuildText,
                permissionOverwrites: getMatchPerms(this.matchRoleId),
                position: 0,
                parent: tokens.MatchCategory,
                reason: 'Create final match channel',
            });
            this.finalChannelId = finalChannel.id;
            let totalAPAC = 0;
            let totalEUE = 0;
            let totalEUW = 0;
            let totalNAE = 0;
            let totalNAW = 0;
            for (let user of this.users) {
                switch (user.region) {
                    case Regions.APAC: totalAPAC++; break;
                    case Regions.EUE: totalEUE++; break;
                    case Regions.EUW: totalEUW++; break;
                    case Regions.NAE: totalNAE++; break;
                    case Regions.NAW: totalNAW++; break;
                }
            }
            let serverMessage;
            if (totalAPAC === 0 && totalEUE === 0 && totalEUW === 0) {
                if (totalNAE > 0 && totalNAW === 0) {
                    //serverMessage = "Play on NAE because all players are NA and there are no west coast players.";
                } else if (totalNAW > 0 && totalNAE === 0) {
                    //serverMessage = "Play in order of priority: NAW, NAC, NAE because all players are NA and there are no east coast players.";
                } else if (totalNAE > 0 && totalNAW > 0) {
                    //serverMessage = "Play in order of priority: NAC, NAE, NAW because all players are NA.";  
                }
                if (this.server && this.server.region == Regions.NAE) {
                    serverMessage = "Play on NAE server because all players are NA.";
                } else {
                    serverMessage = "Play on NAC server because all players are NA.";
                }

            } else if (totalAPAC === 0 && totalNAE === 0 && totalNAW === 0) {
                serverMessage = "Play on EU because all players are EU.";  
                this.serverSetup = false;
            } else if (totalEUE === 0 && totalEUW === 0 && totalNAE === 0 && totalNAW === 0) {
                serverMessage = "Play on APAC because all players are APAC.";  
                this.serverSetup = false;
            } else if (totalAPAC === 0) {
                // No APAC, only NA + EU
                if (totalNAW > 0) {
                    serverMessage = "Play on NAE because there are NAW players and EU players.";
                } else if (totalNAW === 0 && totalEUE > 0) {
                    serverMessage = "Play on EU because there are EUE players and no NAW players. If all EUE players agree, NAE may be used.";
                } else if ( (totalNAE + totalNAW) > (totalEUE + totalEUW) ) { 
                    serverMessage = "Play on NAE because majority NA over EU. If all NA players agree, EU may be used.";
                } else {
                    serverMessage = "Play on EU because majority EU over NA. If all EU players agree, NAE may be used.";
                }
            } else if (totalAPAC > 0) {
                // There are APAC players, but not only APAC players
                if ((totalEUE + totalEUW) > 0) {
                    serverMessage = "Play on NAC because there are APAC and EU players in this game";
                } else {
                    serverMessage = "Play on NAW because there are APAC players and no EU players in this game.";
                }
            } else {
                serverMessage = "The bot failed to pick a region. Please let the moderators know.";
            }
          
            let message;
            if (this.server && this.serverSetup) {
                try {
                    await this.switchMap();
                } catch (e) {
                    console.error(e);
                }
                message = await finalChannel.send({components: [initialSubmit(), initialSubmitServer()],
                    embeds: [await teamsEmbed(this.users, this.matchNumber, this.queueId, this.mapData!, this.sides, this.data)],
                    content: `${serverMessage}. This match might be played on the server titled: \`SMM Match-${this.matchNumber}\`\n`
                });
            } else {
                message = await finalChannel.send({components: [initialSubmit()],
                    embeds: [await teamsEmbed(this.users, this.matchNumber, this.queueId, this.mapData!, this.sides, this.data)],
                    content: `${serverMessage}`
                });
            }

            await finalChannel.messages.pin(message);
            await finalChannel.send({ content: `\`\`\`${serverMessage}\`\`\`` });
            this.finalGenTime = moment().unix();
            await teamAChannel.delete();
            await teamBChannel.delete();
          
            const gameTemp = await getGameById(this.id);
            const game = gameTemp!;
            game.map = this.map;
            game.sides = this.sides;
            await updateGame(game);
            this.votingFinished = true;
        }
    }

    async vote(userId: Types.ObjectId, vote: '1' | '2' | '3' | '4' | '5' | '6' | '7'): Promise<InternalResponse> {
        const id = String(userId);
        const userVotes = this.votes.get(id);
        let message;
        if (this.state == 1 || this.state == 3) {
            let invalid = false;
            this.users.forEach((value) => {
                if (String(value.dbId) == String(userId) && value.team != 0) {
                    invalid = true;
                }
            })
            if (invalid) {
                return {success: false, message: "You cannot vote as you are not on this team"};
            }
        }
        if (this.state == 2 || this.state == 4) {
            let invalid = false;
            this.users.forEach((value) => {
                if (String(value.dbId) == String(userId) && value.team != 1) {
                    invalid = true;
                }
            })
            if (invalid) {
                return {success: false, message: "You cannot vote as you are not on this team"};
            }
        }

        if (userVotes) {
            if (userVotes.includes(vote)) {
                userVotes.forEach((value, index) => {if (value == vote) userVotes.splice(index, 1);});
                this.votes.set(id, userVotes);
                message = `Removed vote for ${this.mapSet[vote]}`;
            } else if (userVotes.length == this.currentMaxVotes) {
                if (this.state >= 4) {
                    return {
                        success: false,
                        message: `Please remove one of your previous votes:${getPreviousVotes(userVotes, this.sideSet)}`
                    }
                } else {
                    return {
                        success: false,
                        message: `Please remove one of your previous votes:${getPreviousVotes(userVotes, this.mapSet)}`
                    }
                }
            } else {
                userVotes.push(vote);
                this.votes.set(id, userVotes);
                if (this.state >= 4) {
                    message = `Added vote for ${this.sideSet[vote as '1' | '2']}`;
                } else {
                    message = `Added vote for ${this.mapSet[vote]}`;
                }
            }
        } else {
            this.votes.set(id, [vote])
            if (this.state >= 4) {
                message = `Added vote for ${this.sideSet[vote as '1' | '2']}`;
            } else {
                message = `Added vote for ${this.mapSet[vote]}`;
            }
        }
        let one = 0;
        let two = 0;
        let three = 0;
        let four = 0;
        let five = 0;
        let six = 0;
        let seven = 0;

        for (let vote of this.votes.values()) {
            for (let subVote of vote) {
                switch (subVote) {
                    case '1':
                        one++;
                        break;
                    case '2':
                        two++;
                        break;
                    case '3':
                        three++;
                        break;
                    case '4':
                        four++;
                        break;
                    case '5':
                        five++;
                        break;
                    case '6':
                        six++;
                        break;
                    case '7':
                        seven++;
                        break;
                }
            }
        }

        switch (this.state) {
            case 1: {
                const teamAChannel = await this.guild.channels.fetch(this.teamAChannelId) as TextChannel;
                const mapVoteMessage = await teamAChannel.messages.fetch(this.voteA1MessageId);
                await mapVoteMessage.edit({content: mapVoteMessage.content,
                    components: voteA1(this.mapSet["1"], one, this.mapSet["2"], two, this.mapSet["3"], three, this.mapSet["4"], four,
                        this.mapSet["5"], five, this.mapSet["6"], six, this.mapSet["7"], seven)});
            } break;
            case 2: {
                const teamBChannel = await this.guild.channels.fetch(this.teamBChannelId) as TextChannel;
                const mapVoteEdit = await teamBChannel.messages.fetch(this.voteB1MessageId);
                await mapVoteEdit.edit({content: mapVoteEdit.content,
                    components: [voteB1(this.mapSet["1"], one, this.mapSet["2"], two, this.mapSet["3"], three, this.mapSet["4"], four)]});
            } break;
            case 3: {
                const teamAChannel = await this.guild.channels.fetch(this.teamAChannelId) as TextChannel;
                const mapVoteMessage = await teamAChannel.messages.fetch(this.voteA2MessageId);
                await mapVoteMessage.edit({content: mapVoteMessage.content,
                    components: [voteA2(this.mapSet["1"], one, this.mapSet["2"], two)]});
            } break;
            case 4: {
                const teamBChannel = await this.guild.channels.fetch(this.teamBChannelId) as TextChannel;
                const sideVoteMessage = await teamBChannel.messages.fetch(this.voteB2MessageId);
                await sideVoteMessage.edit({content: sideVoteMessage.content,
                    components: [voteB2(this.sideSet["1"], one, this.sideSet["2"], two)]});
            } break;
        }
        return {success: true, message: message};
    }

    async resetSND() {
        return this.server!.resetSND();
    }

    async confirmScoreSubmit() {
        if (!this.scoresConfirmMessageSent) {
            this.scoresConfirmMessageSent = true;
            const channel = await this.guild.channels.fetch(this.finalChannelId) as TextChannel;
            await channel.send({components: [acceptScore()], embeds: [matchConfirmEmbed(this.scores)]});
        }
        if (this.scoresAccept[0] && this.scoresAccept[1]) {
            this.state = 7;
        }
    }

    getTeam(userId: Types.ObjectId) {
        for (let user of this.users) {
            if (String(user.dbId) == String(userId)) {
                return user.team;
            }
        }
        return -1;
    }

    async acceptScore(userId: Types.ObjectId): Promise<InternalResponse> {
        const team = this.getTeam(userId);
        if (team >= 0) {
            this.scoresAccept[team] = true;
            const channel = await this.client.channels.fetch(this.finalChannelId) as TextChannel;
            if (team == 0) {
                await channel.send("Team a has accepted scores");
                try {
                    // Find the user's discord ID for logging
                    const user = this.users.find(u => String(u.dbId) === String(userId));
                    if (user) {
                        await logScoreAccept(user.discordId, this.matchNumber, "Team A", this.client);
                    }
                } catch (e) {
                    console.error("Failed to log score acceptance:", e);
                }
            } else {
                await channel.send("Team b has accepted scores");
                try {
                    // Find the user's discord ID for logging
                    const user = this.users.find(u => String(u.dbId) === String(userId));
                    if (user) {
                        await logScoreAccept(user.discordId, this.matchNumber, "Team B", this.client);
                    }
                } catch (e) {
                    console.error("Failed to log score acceptance:", e);
                }
            }
            return {success: true, message: 'Accepted scores'};
        }
        return {success: false, message: 'Could not find team'};
    }

    async submitScore(userId: Types.ObjectId, score: number, discordId: string): Promise<InternalResponse> {
        // Prevent score submission after confirmation
        if (this.state >= 7) {
            return {success: false, message: "Scores have already been confirmed and cannot be changed."};
        }
        if (this.submitCooldown > 0) {
            return {success: false, message: "Please wait before submitting scores"};
        }
        const team = this.getTeam(userId);
        if (team < 0) {
            return {success: false, message: 'Could not find the team you are on'};
        }
        if (this.scores[0] < 0 && this.scores[1] < 0) {
            this.scores[team] = score;
            await logScoreSubmit(discordId, this.matchNumber, score, this.client);
            return {success: true, message: `Score of ${score} submitted for ${(team == 0) ? "team a" : "team b"} by <@${discordId}>`}
        } else {
            let scoreA = this.scores[0];
            let scoreB = this.scores[1];

            if (team == 0) {
                scoreA = score;
            } else {
                scoreB = score;
            }
            if (((scoreA + scoreB) <= 19) && scoreA <= 10 && scoreB <= 10) {
                if (scoreA >= 0 && scoreB >= 0) {
                    this.state = 6;
                    this.scoresConfirmMessageSent = false;
                    this.scores = [scoreA, scoreB];
                }
                await logScoreSubmit(discordId, this.matchNumber, score, this.client);
                return {success: true, message: `Score of ${score} submitted for ${(team == 0) ? "team a" : "team b"} by <@${discordId}>`};
            } else if (team == 0) {
                this.scores[0] = scoreA;
                await logScoreSubmit(discordId, this.matchNumber, score, this.client);
                return {success: true, message: `Score of ${score} submitted for team a by <@${discordId}>`};
            } else if (team == 1) {
                this.scores[1] = scoreB;
                await logScoreSubmit(discordId, this.matchNumber, score, this.client);
                return {success: true, message: `Score of ${score} submitted for team b by <@${discordId}>`};
            } else {
                return {success: false, message: `Invalid score of ${score} submitted`}
            }


        }
    }

    forceScore(scoreA: number, scoreB: number): InternalResponse {
        if ((scoreA == 10 && scoreB == 10)) {
            return {success: false, message: 'Invalid scores'}
        }
        this.scores = [scoreA, scoreB];
        this.state = 7;
        this.scoresAccept = [true, true];
        return {success: true, message: `Scores force submitted
        \`team_a: ${scoreA}\nteam_b: ${scoreB}\``, flags: new MessageFlagsBitField().add(MessageFlagsBitField.Flags.Ephemeral).toJSON()}
    }

    async userAccept(id: Types.ObjectId) {
        for (let user of this.users) {
            if (String(user.dbId) == String(id)) {
                user.accepted = true;
                await logAccept(user.discordId, this.matchNumber, this.client);
            }
        }
    }

    getUsers() {
        return this.users;
    }

    async abandonCleanup(nullify: boolean, queue: RateLimitedQueue) {
        const game = await getGameById(this.id);
        if (nullify) {
            game!.nullified = true;
        } else {
            game!.abandoned = true;
        }
        await updateGame(game!);
        this.cleanedUp = true;
        queue.queue(async () => {
            const channel = await this.guild.channels.fetch(this.acceptChannelId);
            await channel?.delete();
        });
        queue.queue(async () => {
            const channel = await this.guild.channels.fetch(this.teamAChannelId);
            await channel?.delete();
        });
        queue.queue(async () => {
            const channel = await this.guild.channels.fetch(this.teamBChannelId);
            await channel?.delete();
        });
        this.processed = true;
        await this.cleanup(queue);
    }

    async cleanup(queue: RateLimitedQueue) {
        await this.server?.unregisterServer()
        queue.queue(async () => {
            const role = await this.guild.roles.fetch(this.matchRoleId);
            await role?.delete();
        });
        queue.queue(async () => {
            const role = await this.guild.roles.fetch(this.teamARoleId);
            await role?.delete();
        });
        queue.queue(async () => {
            const role = await this.guild.roles.fetch(this.teamBRoleId);
            await role?.delete();
        });
        queue.queue(async () => {
            const channel = await this.guild.channels.fetch(this.finalChannelId);
            await channel?.delete();
        });
        if (!this.cleanedUp && !this.abandoned) {
            await this.sendScoreEmbed();
        }
    }

    async sendScoreEmbed() {
        this.cleanedUp = true
        const game = await getGameById(this.id);
        const channel = await this.guild.channels.fetch(tokens.SNDScoreChannel) as TextChannel;
        await channel.send({content: `Match ${this.matchNumber}`, embeds: [matchFinalEmbed(game!, this.users, this.mapData!)]});
    }

    isProcessed() {
        return this.processed;
    }

    getInfo(): GameData {
        let userData: string[] = []
        for (let user of this.users) {
            userData.push(`<@${user.discordId}>`)
        }
        return {
            id: this.id,
            matchNumber: this.matchNumber,
            tickCount: this.tickCount,
            state: this.state,
            users: userData,
            map: this.map,
            sides: this.sides,
            score: this.scores,
        }
    }

    getMissing() {
        let missingStr = '';
        for (let user of this.users) {
            if (!user.accepted) {
                missingStr += `<@${user.discordId}>  `;
            }
        }
        return missingStr + "\nPlease accept the match";
    }

    async sendAbandonMessage(userId: string) {
        const guild = await this.client.guilds.fetch(tokens.GuildID);
        if (this.state == 10) {
            const channel = await this.guild.channels.fetch(this.acceptChannelId) as TextChannel;
            await channel.send(`<@&${this.matchRoleId}> <@${userId}> has failed to accept the match. You have been placed in queue for 15 minutes`);
            return;
        } else if (this.state > 10 && this.state < 15) {
            try {
                const channelA = await this.guild.channels.fetch(this.teamAChannelId) as TextChannel;
                await channelA.send(`<@&${this.matchRoleId}> <@${userId}> has abandoned the match and this channel will be deleted in 30 seconds you can ready up again now`);
                const channelB = await this.guild.channels.fetch(this.teamBChannelId) as TextChannel;
                await channelB.send(`<@&${this.matchRoleId}> <@${userId}> has abandoned the match and this channel will be deleted in 30 seconds you can ready up again now`);
            } catch (e) {
                await logWarn("Failed to send abandon message during voting phase", this.client);
            }
        } else {
            try {
                const channel = await this.guild.channels.fetch(this.finalChannelId) as TextChannel;
                await channel.send(`<@&${this.matchRoleId}> <@${userId}> has abandoned the match and this channel will be deleted in 30 seconds you can ready up again now`);
            } catch (e) {
                await logWarn("Failed to send abandon message during final phase", this.client);
            }
        }
        for (let user of this.users) {
            const member = await guild.members.fetch(user.discordId);
            if (!member.dmChannel) {
                await member.createDM(true);
            }
            const dbUser = await getUserById(user.dbId, this.data);
            if (dbUser.dmMatch) {
                try {
                    await member.dmChannel!.send("A player has abandoned the match, the channel will be deleted in 30 seconds. You can ready up again now.");
                } catch (e) {
                    await logWarn(`Could not dm user -${dbUser.id}`, this.client);
                }
            }
        }
        return;
    }

    requeue(user: UserInt): boolean {
        if (this.requeueArray.find((item) => {return String(item) == String(user._id)})) {
            this.requeueArray.forEach((value, index) => {
                if (String(value) == String(user._id)) this.requeueArray.splice(index, 1);
            })
            return false;
        } else {
            this.requeueArray.push(user._id)
            return true;
        }
    }
}
