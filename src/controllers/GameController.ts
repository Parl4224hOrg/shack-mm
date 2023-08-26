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
import {voteMap, voteSide} from "../views/voteViews";
import {initialSubmit} from "../views/submitScoreViews";
import {matchConfirmEmbed, matchFinalEmbed, teamsEmbed} from "../embeds/matchEmbeds";
import {GameData, InternalResponse} from "../interfaces/Internal";
import {logWarn} from "../loggers";
import {GameUser, ids} from "../interfaces/Game";
import {Vote} from "../interfaces/Game";
import {acceptScore} from "../views/submitScoreViews";

export class GameController {
    readonly id: ObjectId;
    readonly matchNumber: number;
    private readonly client: Client;
    private readonly guild: Guild;
    private tickCount: number = 0;
    private state: number = 0;
    private users: GameUser[] = [];
    private readonly queueId: string = '';
    private readonly scoreLimit: number = 0;

    private acceptChannelGen = false;
    private acceptChannelId = '';
    private matchRoleId = '';
    private acceptCountdown = 300;

    private voteChannelsGen = false;
    private teamAChannelId = '';
    private teamARoleId = '';
    private teamBChannelId = '';
    private teamBRoleId = '';
    private mapVoteMessageId = '';
    private sideVoteMessageId = '';
    private voteCountdown = 30;
    private votes: Collection<string, string> = new Collection<string, string>();

    private map = '';
    private sides = ['', ''];

    private finalChannelGen = false;
    private finalChannelId = '';

    private scores = [-1, -1];
    private scoreAccept = [false, false];
    private scoreConfirmMessageSent = false;
    private processed = false;

    private abandoned = false;
    private abandonCountdown = 30;
    private cleanedUp = false;

    constructor(id: ObjectId, client: Client, guild: Guild, matchNumber: number, teamA: ids[], teamB: ids[], queueId: string, scoreLimit: number) {
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
    }

    async tick() {
        try {
            this.tickCount++;
            switch (this.state) {
                case 0:
                    await this.acceptPhase();
                    break;
                case 1:
                    await this.votePhase();
                    break;
                case 4:
                    await this.confirmScoreSubmit();
                    break;
                case 5:
                    await this.processMatch();
                    break;
                default:
                    if (this.abandoned && this.abandonCountdown <= 0 && !this.cleanedUp) {
                        await this.abandonCleanup(false);
                    }
            }
        } catch (e) {
            console.error(e);
        }
    }

    async processMatch() {
        this.state = 6;

        const channel = await this.guild.channels.fetch(this.finalChannelId) as TextChannel;
        await channel.send({content: "Scores have been accepted"});

        const gameTemp = await getGameById(this.id);
        const game = gameTemp!;
        game.map = this.map;
        game.scoreA = this.scores[0];
        game.scoreB = this.scores[1];
        game.endDate = moment().unix();
        if (game.scoreA == 7) {
            game.winner = 0;
        } else if (game.scoreB == 7) {
            game.winner = 0;
        } else {
            game.winner = -1;
        }
        const changes = await processMMR(this.users, this.scores, this.queueId, this.scoreLimit);
        game.teamAChanges = changes[0];
        game.teamBChanges = changes[1];

        await updateGame(game);

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

            await acceptChannel.send({content: `${matchRole.toString()} ${tokens.AcceptMessage}`, components: [acceptView()]});
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
        if (this.acceptCountdown <= 0) {
            for (let user of this.users) {
                if (!user.accepted) {
                    await this.abandon(user)
                }
            }
            this.state = -1;
        }
    }

    hasChannel(id: string) {
        return this.acceptChannelId == id || this.finalChannelId == id || this.teamAChannelId == id || this.teamBChannelId == id;
    }

    async abandon(user: GameUser) {
        this.state = -1;
        this.abandoned = true;
        await abandon(user.dbId, this.guild);
        await this.sendAbandonMessage(user.discordId);
    }

    async votePhase() {
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

            const teamAMessage = await teamAChannel.send({components: [voteMap(0, 0 ,0)], content: `${teamARole.toString()} Please vote on the map you want to play`});
            this.mapVoteMessageId = teamAMessage.id;

            const teamBMessage = await teamBChannel.send({components: [voteSide(0, 0)], content: `${teamBRole.toString()} Please vote on the side you want to play`});
            this.sideVoteMessageId = teamBMessage.id;

        } else if (this.voteCountdown <= 0) {
            this.state = 2;
            if (!this.finalChannelGen) {
                let enforcer = 0;
                let revolter = 0;
                let factory: Vote = {total: 0, id: 'factory'};
                let hideout: Vote = {total: 0, id: 'hideout'};
                let skyscraper: Vote = {total: 0, id: 'skyscraper'};

                for (let vote of this.votes.values()) {
                    switch (vote) {
                        case 'enforcer-vote': enforcer++; break;
                        case 'revolter-vote': revolter++; break;
                        case 'factory-vote': factory.total++; break;
                        case 'hideout-vote': hideout.total++; break;
                        case 'skyscraper-vote': skyscraper.total++; break;
                    }
                }

                let mapVotes = [factory, hideout, skyscraper];

                mapVotes = mapVotes.sort((a, b) => b.total-a.total);

                if (mapVotes[0].total == mapVotes[1].total) {
                    if (mapVotes[0].total == mapVotes[2].total) {
                        this.map = mapVotes[Math.floor(Math.random() * 3)].id;
                    } else {
                        this.map = mapVotes[Math.floor(Math.random() * 2)].id;
                    }
                } else {
                    this.map = mapVotes[0].id;
                }

                if (enforcer > revolter) {
                    this.sides = ['Enforcers', 'Revolters'];
                } else if (enforcer < revolter) {
                    this.sides = ['Enforcers', 'Revolters'];
                } else {
                    if (Math.floor(Math.random() * 2) == 0) {
                        this.sides = ['Enforcers', 'Revolters'];
                    } else {
                        this.sides = ['Enforcers', 'Revolters'];
                    }
                }

                const finalChannel = await this.guild.channels.create({
                    name: `match-${this.matchNumber}`,
                    type: ChannelType.GuildText,
                    permissionOverwrites: getMatchPerms(this.matchRoleId),
                    position: 0,
                    parent: tokens.MatchCategory,
                    reason: 'Create final match channel',
                });
                this.finalChannelId = finalChannel.id;
                const message = await finalChannel.send({components: [initialSubmit()], embeds: [teamsEmbed(this.users, this.matchNumber, this.queueId, this.map, this.sides)]});
                finalChannel.messages.pin(message);
                const teamAChannel = await this.guild.channels.fetch(this.teamAChannelId);
                await teamAChannel?.delete();
                const teamBChannel = await this.guild.channels.fetch(this.teamBChannelId);
                await teamBChannel?.delete();
            }
        }
    }

    async vote(userId: ObjectId, vote: string): Promise<InternalResponse> {
        const id = String(userId);
        this.votes.set(id, vote);
        let enforcer = 0;
        let revolter = 0;
        let factory = 0;
        let hideout = 0;
        let skyscraper = 0;

        for (let vote of this.votes.values()) {
            switch (vote) {
                case 'enforcer-vote': enforcer++; break;
                case 'revolter-vote': revolter++; break;
                case 'factory-vote': factory++; break;
                case 'hideout-vote': hideout++; break;
                case 'skyscraper-vote': skyscraper++; break;
            }
        }

        const teamAChannel = await this.guild.channels.fetch(this.teamAChannelId) as TextChannel;
        const mapVoteMessage = await teamAChannel.messages.fetch(this.mapVoteMessageId);
        await mapVoteMessage.edit({content: mapVoteMessage.content, components: [voteMap(factory, hideout, skyscraper)]});

        const teamBChannel = await this.guild.channels.fetch(this.teamBChannelId) as TextChannel;
        const sideVoteMessage = await teamBChannel.messages.fetch(this.sideVoteMessageId);
        await sideVoteMessage.edit({content: sideVoteMessage.content, components: [voteSide(enforcer, revolter)]});

        const voteStr = vote.substring(0, vote.indexOf('-'))
        return {success: true, message: `voted for ${voteStr.charAt(0).toUpperCase() + voteStr.slice(1)}`};
    }

    async confirmScoreSubmit() {
        if (!this.scoreConfirmMessageSent) {
            this.scoreConfirmMessageSent = true;
            const channel = await this.guild.channels.fetch(this.finalChannelId) as TextChannel;
            await channel.send({components: [acceptScore()], embeds: [matchConfirmEmbed(this.scores)]});
        }
        if (this.scoreAccept[0] && this.scoreAccept[1]) {
            this.state = 5;
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
            this.scoreAccept[team] = true;
            return {success: true, message: 'Accepted scores'};
        }
        return {success: false, message: 'Could not find team'};
    }

    async submitScore(userId: ObjectId, score: number): Promise<InternalResponse> {
        const team = this.getTeam(userId);
        if (team < 0) {
            return {success: false, message: 'Could not find the team you are on'};
        }
        if (this.scores[0] < 0 && this.scores[1] < 0) {
            this.scores[team] = score;
            this.state = 3;
            return {success: true, message: `Score of ${score} submitted for ${(team == 0) ? "team a" : "team b"}`}
        } else {
            let scoreA = this.scores[0];
            let scoreB = this.scores[1];

            if (team == 0) {
                scoreA = score;
            } else {
                scoreB = score;
            }
            if (((scoreA + scoreB) <= 12) && scoreA <= 7 && scoreB <= 7) {
                if (scoreA >= 0 && scoreB >= 0) {
                    this.state = 4;
                    this.scoreConfirmMessageSent = false;
                    this.scores = [scoreA, scoreB];
                }
                return {success: true, message: `Score of ${score} submitted for ${(team == 0) ? "team a" : "team b"}`};
            } else if (team == 0 && scoreB < 0) {
                this.scores[0] = scoreA;
                return {success: true, message: `Score of ${score} submitted for team a`};
            } else if (team == 1 && scoreA < 0) {
                this.scores[1] = scoreB;
                return {success: true, message: `Score of ${score} submitted for team b`};
            } else {
                return {success: false, message: "Invalid score submitted"}
            }


        }
    }

    forceScore(scoreA: number, scoreB: number): InternalResponse {
        if ((scoreA == 7 && scoreB == 7) || (scoreA == 6 && scoreB != 6) || (scoreA != 6 && scoreB == 6)) {
            return {success: false, message: 'Invalid scores'}
        }
        this.scores = [scoreA, scoreB];
        this.state = 5;
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
        await this.sendScoreEmbed();
    }

    async sendScoreEmbed() {
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
        if (this.state == 0) {
            const channel = await this.guild.channels.fetch(this.acceptChannelId) as TextChannel;
            await channel.send(`<@&${this.matchRoleId}> <@${userId}> has abandoned the match and this channel will be deleted in 30 seconds you can ready up again now`);
        } else if (this.state == 1) {
            const channelA = await this.guild.channels.fetch(this.teamAChannelId) as TextChannel;
            await channelA.send(`<@&${this.matchRoleId}> <@${userId}> has abandoned the match and this channel will be deleted in 30 seconds you can ready up again now`);
            const channelB = await this.guild.channels.fetch(this.teamBChannelId) as TextChannel;
            await channelB.send(`<@&${this.matchRoleId}> <@${userId}> has abandoned the match and this channel will be deleted in 30 seconds you can ready up again now`);
        } else {
            const channel = await this.guild.channels.fetch(this.finalChannelId) as TextChannel;
            await channel.send(`<@&${this.matchRoleId}> <@${userId}> has abandoned the match and this channel will be deleted in 30 seconds you can ready up again now`);
        }
    }
}
