import {SubCommand} from "../../../interfaces/Command";
import {SlashCommandSubcommandBuilder} from "discord.js";
import {logError} from "../../../loggers";
import {queues} from "../../../utility/options";
import GameModel from "../../../database/models/GameModel";
import {getUserById} from "../../../modules/getters/getUser";
import {processMMR} from "../../../utility/processMMR";
import {GameUser} from "../../../interfaces/Game";
import {updateGame} from "../../../modules/updaters/updateGame";
import tokens from "../../../tokens";
import StatsModel from "../../../database/models/StatsModel";
import {Regions} from "../../../database/models/UserModel";

export const reCalc: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('re_calc')
        .setDescription('re_calcs mmr for a queue')
        .addStringOption(queues),
    run: async (interaction, data) => {
        try {
            await interaction.deferReply({ephemeral: true});
            const games = await GameModel.find({scoreB: {"$gte": 0}, scoreA: {'$gte': 0}}).sort({matchId: 1});
            await StatsModel.deleteMany({queueId: "SND"})
            for (let game of games) {
                let teamA = [];
                let teamB = [];
                let users: GameUser[] = [];
                for (let player of game.teamA) {
                    const user = await getUserById(player, data)
                    users.push({
                        dbId: player,
                        discordId: user.id,
                        team: 0,
                        accepted: true,
                        region: Regions.APAC,
                        joined: false,
                    })
                    teamA.push(user);
                }
                for (let player of game.teamB) {
                    const user = await getUserById(player, data)
                    users.push({
                        dbId: player,
                        discordId: user.id,
                        team: 1,
                        accepted: true,
                        region: Regions.APAC,
                        joined: false,
                    })
                    teamB.push(user);
                }
                const results = await processMMR(users, [game.scoreA, game.scoreB], "SND", 10);
                game.teamAChanges = results[0];
                game.teamBChanges = results[1];
                await updateGame(game);
            }
            await interaction.followUp({ephemeral: true, content: 'done'});
        } catch (e) {
            await logError(e, interaction)
        }
    },
    name: 're_calc',
    allowedUsers: [tokens.Parl],
}