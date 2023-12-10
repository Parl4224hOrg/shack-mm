import {ObjectId} from "mongoose";
import {ChannelType, Client, Collection, Guild, TextChannel} from "discord.js";
import {getGameById} from "../modules/getters/getGame";
import moment from "moment/moment";
import {processMMR} from "../utility/processMMR";
import {updateGame} from "../modules/updaters/updateGame";
import {getGuildMember} from "../utility/discordGetters";
import {getMatchPerms} from "../utility/channelPerms";
import tokens from "../tokens";
import {acceptView} from "../views/acceptView";
import {abandon} from "../utility/punishment";
import {voteA1, voteA2, voteB1, voteB2} from "../views/voteViews";
import {initialSubmit} from "../views/submitScoreViews";
import {matchConfirmEmbed, matchFinalEmbed, teamsEmbed} from "../embeds/matchEmbeds";
import {GameData, InternalResponse} from "../interfaces/Internal";
import {logWarn} from "../loggers";
import {GameUser, ids} from "../interfaces/Game";
import {Vote} from "../interfaces/Game";
import {acceptScore} from "../views/submitScoreViews";
import {GameControllerInt} from "../database/models/GameControllerModel";
import {updateRanks} from "../utility/ranking";

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

    constructor(id: ObjectId, client: Client, guild: Guild, matchNumber: number, teamA: ids[], teamB: ids[], queueId: string, scoreLimit: number, bannedMaps: string[]) {
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
            });
        }
        for (let user of teamB) {
            this.users.push({
                dbId: user.db,
                discordId: user.discord,
                team: 1,
                accepted: false,
            });
        }
        let i = 1;
        for (let mapCheck of tokens.MapPool) {
            if (!bannedMaps.includes(mapCheck) && i <= 7) {
                this.mapSet[String(i) as "1" | "2" | "3" | "4" | "5" | "6" | "7"] = mapCheck;
                i++;
            }
        }
        for (let ban of bannedMaps) {
            this.allBans.push(ban);
        }
    }

    async tick() {
        try {
            this.tickCount++;
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
                    } else {
                        this.submitCooldown--;
                    }
            }
        } catch (e) {
            console.error(e);
        }
    }

    async load(data: GameControllerInt) {
        this.tickCount = data.tickCount;
        this.state = data.state;
        this.users = data.users;

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
        let temp: Collection<string, string[]> = new Collection<string, string[]>();
        for (let vote of data.votes) {
            temp.set(vote.id, vote.vote);
        }
        this.votes = temp;
        this.mapSet = data.mapSet;
        this.currentMaxVotes = data.currentMaxVotes

        this.map = data.map;
        this.sides = data.sides;

        this.finalChannelGen = data.finalChannelGen;
        this.finalChannelId = data.finalChannelId;

        this.scores = data.scores;
        this.scoresAccept = data.scoresAccept;
        this.scoresConfirmMessageSent = data.scoresConfirmMessageSent;
        this.processed = data.processed;

        this.abandoned = data.abandoned;
        this.abandonCountdown = data.abandonCountdown;
        this.cleanedUp = data.cleanedUp;
    }

    async processMatch() {
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
        const changes = await processMMR(this.users, this.scores, this.queueId, this.scoreLimit);
        game.teamAChanges = changes[0];
        game.teamBChanges = changes[1];

        await updateGame(game);

        await updateRanks(this.users, this.client);

        this.processed = true;
    }

    async acceptPhase() {
        this.acceptCountdown--;
        if (!this.acceptChannelGen) {
            this.acceptChannelGen = true;
            const matchRole = await this.guild.roles.create({
                name: `match-${this.matchNumber}`,
                reason: 'Create role for match accept'
            });
            this.matchRoleId = matchRole.id;

            for (let user of this.users) {
                const member = await getGuildMember(user.discordId, this.guild);
                await member.roles.add(matchRole);
            }

            const acceptChannel = await this.guild.channels.create({
                name: `match-${this.matchNumber}`,
                type: ChannelType.GuildText,
                permissionOverwrites: getMatchPerms(matchRole),
                position: 0,
                parent: tokens.MatchCategory,
                reason: 'Create channel for match accept'
            });

            this.acceptChannelId = acceptChannel.id;

            const message = await acceptChannel.send({content: `${matchRole.toString()} ${tokens.AcceptMessage}`, components: [acceptView()]});
            await message.pin();
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
        if (this.acceptCountdown <= 0 && !this.abandoned && !this.pleaseStop) {
            this.pleaseStop = true;
            for (let user of this.users) {
                if (!user.accepted && !this.abandoned) {
                    await this.abandon(user);
                }
            }
        }
    }

    hasChannel(id: string) {
        return this.acceptChannelId == id || this.finalChannelId == id || this.teamAChannelId == id || this.teamBChannelId == id;
    }

    async abandon(user: GameUser) {
        this.abandoned = true;
        this.abandonCountdown = tokens.AbandonTime;
        if (this.state < 10) {
            this.state += 10;
        }
        await abandon(user.dbId, this.guild);
        await this.sendAbandonMessage(user.discordId);
    }

    calcVotes(state: number): string[] {
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
                    bans = [mapVotes[0].id, mapVotes[1].id].concat(getRandom(mapVotes, 2, 3, 2));
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

        this.allBans = this.allBans.concat(convertedBans);


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
        this.voteCountdown--;
        if (!this.voteChannelsGen) {
            this.voteChannelsGen = true;
            const acceptChannel = await this.guild.channels.fetch(this.acceptChannelId);
            await acceptChannel?.delete();

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

            const teamAMessage = await teamAChannel.send({
                components: voteA1(this.mapSet["1"], 0, this.mapSet["2"], 0, this.mapSet["3"], 0, this.mapSet["4"],
                    0, this.mapSet["5"], 0, this.mapSet["6"], 0, this.mapSet["7"], 0),
                content: `${teamARole.toString()} Please ban three maps`});
            this.voteA1MessageId = teamAMessage.id;

            await teamBChannel.send({content: `${teamBRole.toString()} Team A is banning 3 maps`});
        } else if (this.voteCountdown <= 0) {
            const bans = this.calcVotes(2);
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
        }
    }

    async voteB1() {
        this.voteCountdown--;
        if (this.voteCountdown <= 0) {
            const bans = this.calcVotes(3);
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
        }
    }

    async voteA2() {
        this.voteCountdown--;
        if (this.voteCountdown <= 0) {
            const bans = this.calcVotes(4);
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
        }
    }

    async voteB2() {
        this.voteCountdown--;
        if (this.voteCountdown <= 0) {
            const bans = this.calcVotes(5);
            const teamAChannel = await this.client.channels.fetch(this.teamAChannelId) as TextChannel;
            const teamBChannel = await this.client.channels.fetch(this.teamBChannelId) as TextChannel;

            const teamB2Message = await teamBChannel.messages.fetch(this.voteB2MessageId)
            await teamB2Message.edit({content: `~~${teamB2Message.content}~~ Voting has ended`, components: []});

            this.sides = [bans[1], bans[0]];

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
            const message = await finalChannel.send({components: [initialSubmit()], embeds: [await teamsEmbed(this.users, this.matchNumber, this.queueId, this.map, this.sides)]});
            await finalChannel.messages.pin(message);
            await teamAChannel.delete();
            await teamBChannel.delete();
        }
    }

    async vote(userId: ObjectId, vote: '1' | '2' | '3' | '4' | '5' | '6' | '7'): Promise<InternalResponse> {
        const id = String(userId);
        const userVotes = this.votes.get(id);
        let message;
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

    acceptScore(userId: ObjectId): InternalResponse {
        const team = this.getTeam(userId);
        if (team >= 0) {
            this.scoresAccept[team] = true;
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
                return {success: true, message: `Score of ${score} submitted for ${(team == 0) ? "team a" : "team b"} by <@${discordId}>`};
            } else if (team == 0) {
                this.scores[0] = scoreA;
                return {success: true, message: `Score of ${score} submitted for team a by <@${discordId}>`};
            } else if (team == 1) {
                this.scores[1] = scoreB;
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
        return {success: true, message: `Scores force submitted
        \`team_a: ${scoreA}\nteam_b: ${scoreB}\``}
    }

    userAccept(id: ObjectId) {
        for (let user of this.users) {
            if (String(user.dbId) == String(id)) {
                user.accepted = true;
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
        if (this.state == 10) {
            const channel = await this.guild.channels.fetch(this.acceptChannelId) as TextChannel;
            await channel.send(`<@&${this.matchRoleId}> <@${userId}> has abandoned the match and this channel will be deleted in 30 seconds you can ready up again now`);
        } else if (this.state == 11) {
            const channelA = await this.guild.channels.fetch(this.teamAChannelId) as TextChannel;
            await channelA.send(`<@&${this.matchRoleId}> <@${userId}> has abandoned the match and this channel will be deleted in 30 seconds you can ready up again now`);
            const channelB = await this.guild.channels.fetch(this.teamBChannelId) as TextChannel;
            await channelB.send(`<@&${this.matchRoleId}> <@${userId}> has abandoned the match and this channel will be deleted in 30 seconds you can ready up again now`);
        } else {
            const channel = await this.guild.channels.fetch(this.finalChannelId) as TextChannel;
            await channel.send(`<@&${this.matchRoleId}> <@${userId}> has abandoned the match and this channel will be deleted in 30 seconds you can ready up again now`);
        }
        return;
    }
}
