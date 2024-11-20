import mongoose, {ObjectId} from "mongoose";
import {ChannelType, Client, Collection, EmbedBuilder, Guild, TextChannel} from "discord.js";
import {getGameById} from "../modules/getters/getGame";
import moment from "moment/moment";
import {processMMR} from "../utility/processMMR";
import {updateGame} from "../modules/updaters/updateGame";
import {getGuildMember} from "../utility/discordGetters";
import {getAcceptPerms, getMatchPerms} from "../utility/channelPerms";
import tokens from "../tokens";
import {acceptView} from "../views/acceptView";
import {abandon} from "../utility/punishment";
import {voteA1, voteA2, voteB1, voteB2} from "../views/voteViews";
import {initialSubmit, initialSubmitServer} from "../views/submitScoreViews";
import {matchConfirmEmbed, matchFinalEmbed, teamsEmbed} from "../embeds/matchEmbeds";
import {GameData, InternalResponse} from "../interfaces/Internal";
import {logInfo, logWarn} from "../loggers";
import {GameUser, ids} from "../interfaces/Game";
import {Vote} from "../interfaces/Game";
import {acceptScore} from "../views/submitScoreViews";
import {updateRanks} from "../utility/ranking";
import {Data} from "../data";
import {Regions, UserInt} from "../database/models/UserModel";
import {getUserById} from "../modules/getters/getUser";
import {updateUser} from "../modules/updaters/updateUser";
import {getMaps, logAccept, logScoreSubmit} from "../utility/match";
import {GameServer} from "../server/server";
import axios from "axios";
import warnModel from "../database/models/WarnModel";
import {getMapUGC} from "../utility/map.util";


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
    readonly id: ObjectId;
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


    map = '';
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

    requeueArray: ObjectId[] = [];

    server: GameServer | null;

    acceptMessageId: string = "";

    autoReadied = false;

    initServer = false;

    serverSetup = true;

    joinedPlayers: Set<string> = new Set();
    
    serverId: string;

    constructor(id: ObjectId, client: Client, guild: Guild, matchNumber: number, teamA: ids[], teamB: ids[], queueId: string, scoreLimit: number, data: Data, server: GameServer | null) {
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
                joined: false
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
            });
        }
        this.data = data;
        this.startTime = moment().unix();

        const maps = getMaps(data);

        for (let map of tokens.MapPool) {
            if (!maps.includes(map)) {
                this.allBans.push(map);
            }
        }

        let i = 1;
        for (let map of maps) {
            this.mapSet[String(i) as "1" | "2" | "3" | "4" | "5" | "6" | "7"] = map;
            i++;
        }

        this.server = server;
        
        if (this.server) {
            this.initServer = true;
            this.serverId = server!.id;
        } else {
            this.serverId = ""
        }
    }

    load(data: any) {
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

        for (let requeue of data.requeueArray) {
            this.requeueArray.push(new mongoose.Types.ObjectId(requeue) as any as ObjectId)
        }

        this.acceptMessageId = data.acceptMessageId;

        this.autoReadied = data.autoReadied ?? false
        
        this.serverId = data.serverInUse ?? ""
    }

    async tick() {
        try {
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
                case 5: {
                    const time = moment().unix();

                    const minutesPassed = Math.floor((time - this.finalGenTime) / 60);
                    const minutesLeft = 5 - minutesPassed;

                    //Every minute countdown
                    if (minutesLeft > 0 && minutesLeft <= 4 && (time - this.finalGenTime) % 60 === 0) {
                        const channel = await this.client.channels.fetch(this.finalChannelId) as TextChannel;
                        await channel.send(`**__${minutesLeft} minutes left to join!__**`);
                    }

                    //Every 30 seconds check server for players
                    if ((time - this.finalGenTime) % 30 === 0 && (time - this.finalGenTime) <= 5 * 60) {
                        await this.updateJoinedPlayers();
                    }

                    // 2 minutes left
                    if (time - this.finalGenTime == 3 * 60 && this.serverSetup) {
                        const channel = await this.client.channels.fetch(this.finalChannelId) as TextChannel;
                        const lateUserMentions: string[] = [];
                        for (let user of this.users) {
                            const dbUser = await getUserById(user.dbId, this.data);
                            if (dbUser && !this.joinedPlayers.has(dbUser.oculusName)) {
                                const logChannel = await this.client.channels.fetch(tokens.LogChannel) as TextChannel;
                                await logChannel.send(`User ${dbUser.oculusName} is late.`);
                                lateUserMentions.push(`<@${user.discordId}>`);
                            }
                        }
                        await channel.send(`Warning: ${lateUserMentions.join(', ')} you have 2 minutes left to join!`);
                    }


                    // 1 minute left
                    if (time - this.finalGenTime == 4 * 60 && this.serverSetup) {
                        const channel = await this.client.channels.fetch(this.finalChannelId) as TextChannel;
                        const lateUserMentions: string[] = [];
                        for (let user of this.users) {
                            const dbUser = await getUserById(user.dbId, this.data);
                            if (dbUser && !this.joinedPlayers.has(dbUser.oculusName)) {
                                const logChannel = await this.client.channels.fetch(tokens.LogChannel) as TextChannel;
                                await logChannel.send(`User ${dbUser.oculusName} is late.`);
                                lateUserMentions.push(`<@${user.discordId}>`);
                            }
                        }
                        await channel.send(`Warning: ${lateUserMentions.join(', ')} you have 1 minute left to join!`);
                    }

                    // 5 minute mark
                    if (time - this.finalGenTime == 5 * 60) {
                        await this.updateJoinedPlayers();
                        const channel = await this.client.channels.fetch(this.finalChannelId) as TextChannel;
                        const lateUsers: GameUser[] = [];
                        if (this.serverSetup) {
                            for (let user of this.users) {
                                const dbUser = await getUserById(user.dbId, this.data);
                                if (dbUser && !this.joinedPlayers.has(dbUser.oculusName)) {
                                    const logChannel = await this.client.channels.fetch(tokens.LogChannel) as TextChannel;
                                    await logChannel.send(`User ${dbUser.oculusName} is late.`);
                                    lateUsers.push(user);
                                }
                            }
                        }
                        await channel.send("5 minutes have passed");
                        const logChannel = await this.client.channels.fetch(tokens.LogChannel) as TextChannel;
                        await logChannel.send(`Game controller line 346, serverSetup value: ${this.serverSetup}`);
                        if (tokens.ApplyLates && this.serverSetup) {
                            if (lateUsers.length > 0 && lateUsers.length < 7) { 
                              for (let user of lateUsers) {
                                  await warnModel.create({
                                      userId: user.dbId,
                                      reason: "bot late",
                                      timeStamp: moment().unix(),
                                      modId: tokens.ClientID,
                                      removed: false,
                                  });
                                  await channel.send(`<@${user.discordId}> has been given a late`);
                              }
                            }
                        } else {
                            await channel.send("Assuming lobby is being used no lates are being applied");
                        }
                    }
                    if (time - this.finalGenTime == 10 * 60) {
                        const channel = await this.client.channels.fetch(this.finalChannelId) as TextChannel;
                        await channel.send("10 minutes have passed");
                    }
                    this.submitCooldown--;
                    if (this.tickCount % 60 == 0 && this.server) {
                        const dbUsers: UserInt[] = [];
                        for (let user of this.users) {
                            dbUsers.push(await getUserById(user.dbId, this.data));
                        }
                        const RefreshList = await this.server.refreshList()
                        if (RefreshList.PlayerList) {
                            for (let user of RefreshList.PlayerList) {
                                let found = false;
                                for (let dbUser of dbUsers) {
                                    if (dbUser.oculusName == user.UniqueId) {
                                        found = true;
                                        const playerInfo = await this.server.inspectPlayer(user.UniqueId);
                                        for (let gameUser of this.users) {
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
                                        }
                                    }
                                }
                                if (!found) {
                                    await this.server.kick(user.UniqueId);
                                }
                                // 1 is T 0 is CT

                            }
                        } else {
                            await logWarn("Player list is empty", this.client);
                        }
                    }
                } break;
                case 6:
                    await this.confirmScoreSubmit();
                    break;
                case 7:
                    await this.processMatch();
                    break;
                default:
                    if (this.abandoned && this.abandonCountdown <= 0 && !this.cleanedUp) {
                        await this.abandonCleanup(false);
                    } else if (this.abandoned) {
                        this.abandonCountdown--;
                    }
            }
        } catch (e) {
            console.error(e);
        }
    }

    async updateJoinedPlayers() {
        const playerList = await this.server?.refreshList();
        if (playerList && playerList.PlayerList) {
            for (let player of playerList.PlayerList) {
                this.joinedPlayers.add(player.UniqueId);
            }
        }
        const logChannel = await this.client.channels.fetch(tokens.LogChannel) as TextChannel;
        const joinedPlayersList = Array.from(this.joinedPlayers).join(', ');
        await logChannel.send(`Current joined players: ${joinedPlayersList}`);
    }

    async switchMap() {
        let mapId = getMapUGC(this.map);
        await this.server!.switchMap(mapId, "SND");
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
                    await updateUser(dbUser, this.data);
                }

                try {
                    await axios.post("https://shackmm.com/bot/update/leaderboard", {
                        matchNumber: this.matchNumber,
                    }, {
                        headers: {
                            key: tokens.BotKey,
                        }
                    })
                } catch (e) {
                    await logWarn("Post did not work", this.client);
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
                const serverInfo = await this.server.serverInfo()
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
            if (this.state < 10) {
                this.state += 10;
            }
            await abandon(user.dbId, user.discordId, this.guild, acceptFail, this.data);
            await this.sendAbandonMessage(user.discordId);
            if (!acceptFail && (this.finalGenTime + 15 * 60 >= moment().unix() || this.finalGenTime == 0)) {
                this.autoReadied = true;
                const temp: GameUser[] = [];
                for (let userCheck of this.users) {
                    if (!(user.discordId == userCheck.discordId)) {
                        temp.push(userCheck);
                    }
                }
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
            for (let map of tokens.MapPool) {
                if (!this.allBans.includes(map)) {
                    newMaps.push(map);
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
            let serverMessage = "";
            if (totalAPAC === 0 && totalEUE === 0 && totalEUW === 0) {
                if (totalNAE > 0 && totalNAW === 0) {
                    //serverMessage = "Play on NAE because all players are NA and there are no west coast players.";
                } else if (totalNAW > 0 && totalNAE === 0) {
                    //serverMessage = "Play in order of priority: NAW, NAC, NAE because all players are NA and there are no east coast players.";
                } else if (totalNAE > 0 && totalNAW > 0) {
                    //serverMessage = "Play in order of priority: NAC, NAE, NAW because all players are NA.";  
                }
                serverMessage = "Play on NA server because all players are NA.";
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
                this.serverSetup = false;
                // There are APAC players, but not only APAC players
                if (totalEUE > 0) {
                    serverMessage = "There are APAC and EUE players in this game. It may be played on NAC if both APAC players and EUE players agree. If not, ping moderators to nullify the match!";
                } else {
                    if ((totalEUE + totalEUW) > 0) {
                        serverMessage = "Play on NAC because there are APAC players and EUW players in this game.";
                    } else {
                        serverMessage = "Play on NAW because there are APAC players and no EU players in this game. NAC may also be played.";
                    }
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
                    embeds: [await teamsEmbed(this.users, this.matchNumber, this.queueId, this.map, this.sides, this.data)],
                    content: `${serverMessage}. This match might be played on the server titled: \`SMM Match-${this.matchNumber}\`\n`
                });
            } else {
                message = await finalChannel.send({components: [initialSubmit()],
                    embeds: [await teamsEmbed(this.users, this.matchNumber, this.queueId, this.map, this.sides, this.data)],
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
        }
    }

    async vote(userId: ObjectId, vote: '1' | '2' | '3' | '4' | '5' | '6' | '7'): Promise<InternalResponse> {
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

    getTeam(userId: ObjectId) {
        for (let user of this.users) {
            if (String(user.dbId) == String(userId)) {
                return user.team;
            }
        }
        return -1;
    }

    async acceptScore(userId: ObjectId): Promise<InternalResponse> {
        const team = this.getTeam(userId);
        if (team >= 0) {
            this.scoresAccept[team] = true;
            const channel = await this.client.channels.fetch(this.finalChannelId) as TextChannel;
            if (team == 0) {
                await channel.send("Team a has accepted scores");
            } else {
                await channel.send("Team b has accepted scores");
            }
            return {success: true, message: 'Accepted scores'};
        }
        return {success: false, message: 'Could not find team'};
    }

    async submitScore(userId: ObjectId, score: number, discordId: string): Promise<InternalResponse> {
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
        \`team_a: ${scoreA}\nteam_b: ${scoreB}\``}
    }

    async userAccept(id: ObjectId) {
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

    async abandonCleanup(nullify: boolean) {
        const game = await getGameById(this.id);
        if (nullify) {
            game!.nullified = true;
        } else {
            game!.abandoned = true;
        }
        await updateGame(game!);
        this.cleanedUp = true;
        try {
            const channel = await this.guild.channels.fetch(this.acceptChannelId);
            await channel?.delete();
        } catch {
            await logWarn("Could not delete accept channel", this.client);
        }
        try {
            const channel = await this.guild.channels.fetch(this.teamAChannelId);
            await channel?.delete();
        } catch {
            await logWarn("Could not delete team a channel", this.client);
        }
        try {
            const channel = await this.guild.channels.fetch(this.teamBChannelId);
            await channel?.delete();
        } catch {
            await logWarn("Could not delete team b channel", this.client);
        }
        this.processed = true;
        await this.cleanup();
    }

    async cleanup() {
        await this.server?.unregisterServer()
        try {
            const role = await this.guild.roles.fetch(this.matchRoleId);
            await role?.delete();
        } catch {
            await logWarn("Could not delete match role", this.client);
        }
        try {
            const role = await this.guild.roles.fetch(this.teamARoleId);
            await role?.delete();
        } catch {
            await logWarn("Could not delete team a role", this.client);
        }
        try {
            const role = await this.guild.roles.fetch(this.teamBRoleId);
            await role?.delete();
        } catch {
            await logWarn("Could not delete team b role", this.client);
        }
        try {
            const channel = await this.guild.channels.fetch(this.finalChannelId);
            await channel?.delete();
        } catch {
            await logWarn("Could not delete final channel", this.client);
        }
        if (!this.cleanedUp && !this.abandoned) {
            await this.sendScoreEmbed();
        }
    }

    async sendScoreEmbed() {
        this.cleanedUp = true
        const game = await getGameById(this.id);
        const channel = await this.guild.channels.fetch(tokens.SNDScoreChannel) as TextChannel;
        await channel.send({content: `Match ${this.matchNumber}`, embeds: [matchFinalEmbed(game!, this.users)]});
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
        } else if (this.state == 11) {
            const channelA = await this.guild.channels.fetch(this.teamAChannelId) as TextChannel;
            await channelA.send(`<@&${this.matchRoleId}> <@${userId}> has abandoned the match and this channel will be deleted in 30 seconds you can ready up again now`);
            const channelB = await this.guild.channels.fetch(this.teamBChannelId) as TextChannel;
            await channelB.send(`<@&${this.matchRoleId}> <@${userId}> has abandoned the match and this channel will be deleted in 30 seconds you can ready up again now`);
        } else {
            const channel = await this.guild.channels.fetch(this.finalChannelId) as TextChannel;
            await channel.send(`<@&${this.matchRoleId}> <@${userId}> has abandoned the match and this channel will be deleted in 30 seconds you can ready up again now`);
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
