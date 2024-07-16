import {SubCommand} from "../../../interfaces/Command";
import {SlashCommandSubcommandBuilder, TextChannel} from "discord.js";
import {logError} from "../../../loggers";
import {queues} from "../../../utility/options";
import GameModel from "../../../database/models/GameModel";
import {getUserById} from "../../../modules/getters/getUser";
import {recalcMMR} from "../../../utility/processMMR";
import {RecalcUser} from "../../../interfaces/Game";
import {updateGame} from "../../../modules/updaters/updateGame";
import tokens from "../../../tokens";
import StatsModel, {StatsInt} from "../../../database/models/StatsModel";
import {UserInt} from "../../../database/models/UserModel";
import {ObjectId} from "mongoose";
import {Data} from "../../../data";
import {getStats} from "../../../modules/getters/getStats";
import {updateStats} from "../../../modules/updaters/updateStats";

const getUser = async (id: ObjectId, cache: Map<ObjectId, UserInt>, data: Data) => {
    const check = cache.get(id);
    if (check) {
        return check
    }
    const found = await getUserById(id, data);
    cache.set(id, found);
    return found;
}

const getCachedStats = async (id: ObjectId, cache: Map<ObjectId, StatsInt>) => {
    const check = cache.get(id);
    if (check) {
        return check
    }
    const found = await getStats(id, "SND");
    cache.set(id, found);
    return found;
}

export const reCalc: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('re_calc')
        .setDescription('re_calcs mmr for a queue')
        .addStringOption(queues),
    run: async (interaction, data) => {
        try {
            await interaction.deferReply({ephemeral: true});
            const games = await GameModel.find({scoreB: {"$gte": 0}, scoreA: {'$gte': 0}}).sort({matchId: 1});
            await StatsModel.deleteMany({queueId: "SND"});

            const statsMap: Map<ObjectId, StatsInt> = new Map<ObjectId, StatsInt>();
            const userMap: Map<ObjectId, UserInt> = new Map<ObjectId, UserInt>();

            const logChannel = await interaction.client.channels.fetch(tokens.ModeratorLogChannel) as TextChannel;

            let count = 0;

            for (let game of games) {
                count++;
                if (count % 100 == 0) {
                    await logChannel.send(`Recalc has completed match ${game.matchId}`);
                }
                let teamA = [];
                let teamB = [];
                let users: RecalcUser[] = [];
                for (let player of game.teamA) {
                    const user = await getUser(player, userMap, data);
                    users.push({
                        dbId: player,
                        discordId: user.id,
                        team: 0,
                        stats: await getCachedStats(player, statsMap),
                    })
                    teamA.push(user);
                }
                for (let player of game.teamB) {
                    const user = await getUser(player, userMap, data);
                    users.push({
                        dbId: player,
                        discordId: user.id,
                        team: 1,
                        stats: await getCachedStats(player, statsMap),
                    })
                    teamB.push(user);
                }
                const results = await recalcMMR(users, [game.scoreA, game.scoreB], "SND", 10);
                game.teamAChanges = results.changes[0];
                game.teamBChanges = results.changes[1];
                await updateGame(game);
                for (let stat of results.stats) {
                    statsMap.set(stat.userId, stat);
                }
            }
            for (let stat of statsMap.values()) {
                await updateStats(stat);
            }
            await interaction.followUp({ephemeral: true, content: 'done'});
        } catch (e) {
            await logError(e, interaction)
        }
    },
    name: 're_calc',
    allowedRoles: [tokens.LeadModRole],
}
