import { SubCommand } from "../../interfaces/Command";
import { SlashCommandSubcommandBuilder } from "@discordjs/builders";
import tokens from "../../tokens";
import { getGameByMatchId } from "../../modules/getters/getGame";
import { logError, logSMMInfo } from "../../loggers";
import moment from "moment";
import { processMMR } from "../../utility/processMMR";
import { updateGame } from "../../modules/updaters/updateGame";
import { EmbedBuilder, TextChannel } from "discord.js";
import { matchFinalEmbed } from "../../embeds/matchEmbeds";
import { GameUser } from "../../interfaces/Game";
import { getUserById } from "../../modules/getters/getUser";
import { Regions } from "../../database/models/UserModel";
import { createAction } from "../../modules/constructors/createAction";
import { Actions } from "../../database/models/ActionModel";
import { reason } from "../../utility/options";
import { getMapData } from "../../utility/match";

export const manualSubmitIfAbandoned: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('manual_submit_if_abandoned')
        .setDescription('Send a match embed and processes scores for it')
        .addIntegerOption(opt => opt
            .setName('match_id')
            .setRequired(true)
            .setDescription('match id to submit match for')
        )
        .addIntegerOption(opt => opt
            .setName('score_a')
            .setRequired(true)
            .setDescription('score for team a')
        )
        .addIntegerOption(opt => opt
            .setName('score_b')
            .setRequired(true)
            .setDescription('score for team a')
        )
        .addStringOption(reason),
    run: async (interaction, data) => {
        try {
            await interaction.deferReply();
            const matchId = interaction.options.getInteger('match_id', true)
            const gameTemp = await getGameByMatchId(matchId);

            if (!gameTemp) {
                await interaction.followUp({ content: `Match ${matchId} not found.` });
                return;
            }

            let game = gameTemp;

            // Check if match already has scores recorded
            if (game.scoreA >= 0 || game.scoreB >= 0) {
                await interaction.followUp({ content: `Match ${matchId} already has scores recorded (${game.scoreA}-${game.scoreB}) and cannot be manually submitted.` });
                return;
            }

            game.scoreA = interaction.options.getInteger('score_a', true);
            game.scoreB = interaction.options.getInteger('score_b', true);
            game.endDate = moment().unix();
            if (game.scoreA == 10) {
                game.winner = 0;
            } else if (game.scoreB == 10) {
                game.winner = 1;
            } else {
                game.winner = -1;
            }
            let users: GameUser[] = []
            for (let user of game.teamA) {
                const dbUser = await getUserById(user, data);
                users.push({ dbId: user, discordId: dbUser.id, team: 0, accepted: true, region: Regions.APAC, joined: false, isLate: false, hasBeenGivenLate: false });
            }
            for (let user of game.teamB) {
                const dbUser = await getUserById(user, data);
                users.push({ dbId: user, discordId: dbUser.id, team: 1, accepted: true, region: Regions.APAC, joined: false, isLate: false, hasBeenGivenLate: false });
            }
            await createAction(Actions.ManualSubmit, interaction.user.id, interaction.options.getString('reason', true), `Score manually submitted for match ${matchId}: ${game.scoreA}-${game.scoreB}`);

            const changes = await processMMR(users, [game.scoreA, game.scoreB], "SND", tokens.ScoreLimitSND);
            game.teamAChanges = changes[0];
            game.teamBChanges = changes[1];

            game = await updateGame(game);
            const mapData = await getMapData(game.map);

            const channel = await interaction.guild!.channels.fetch(tokens.SNDScoreChannel) as TextChannel;
            await channel.send({ content: `Match ${game.matchId}`, embeds: [matchFinalEmbed(game!, users, mapData!)] });
            await data.Leaderboard.setLeaderboard();
            await interaction.followUp({ content: `Match ${game.matchId} has been submitted with:\nTeam A: ${game.scoreA}\nTeam B: ${game.scoreB}` });
            
            //log the cmd
            let logMessage = `<@${interaction.user.id}> used manual_submit_if_abandoned for match ${matchId} with scores teamA: ${game.scoreA}, teamB: ${game.scoreB}.`;
            let modAction = `<@${interaction.user.id}> used manual_submit_if_abandoned`;
            await logSMMInfo(logMessage, interaction.client, modAction);
        }
        catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'manual_submit_if_abandoned',
    allowedRoles: tokens.Mods.concat(tokens.OwnerRole),
}
