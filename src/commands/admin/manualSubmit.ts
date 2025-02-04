import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import tokens from "../../tokens";
import {getGameByMatchId} from "../../modules/getters/getGame";
import {logError} from "../../loggers";
import moment from "moment";
import {processMMR} from "../../utility/processMMR";
import {updateGame} from "../../modules/updaters/updateGame";
import {EmbedBuilder, TextChannel} from "discord.js";
import {matchFinalEmbed} from "../../embeds/matchEmbeds";
import {GameUser} from "../../interfaces/Game";
import {getUserById} from "../../modules/getters/getUser";
import {Regions} from "../../database/models/UserModel";
import {createAction} from "../../modules/constructors/createAction";
import {Actions} from "../../database/models/ActionModel";
import {reason} from "../../utility/options";
import {getMapData} from "../../utility/match";

export const manualSubmit: Command = {
    data: new SlashCommandBuilder()
        .setName('manual_submit')
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
            await interaction.deferReply({ephemeral: false});
            const matchId = interaction.options.getInteger('match_id', true)
            const gameTemp = await getGameByMatchId(matchId);
            let game = gameTemp!;
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
                users.push({dbId: user, discordId: dbUser.id, team: 0, accepted: true, region: Regions.APAC, joined: false, isLate: false, hasBeenGivenLate: false});
            }
            for (let user of game.teamB) {
                const dbUser = await getUserById(user, data);
                users.push({dbId: user, discordId: dbUser.id, team: 1, accepted: true, region: Regions.APAC, joined: false, isLate: false, hasBeenGivenLate: false});
            }
            await createAction(Actions.ManualSubmit, interaction.user.id, interaction.options.getString('reason', true), `Score manually submitted for match ${matchId}: ${game.scoreA}-${game.scoreB}`);

            const changes = await processMMR(users, [game.scoreA, game.scoreB], "SND", tokens.ScoreLimitSND);
            game.teamAChanges = changes[0];
            game.teamBChanges = changes[1];

            game = await updateGame(game);
            const mapData = await getMapData(game.map);

            const channel = await interaction.guild!.channels.fetch(tokens.SNDScoreChannel) as TextChannel;
            await channel.send({content: `Match ${game.matchId}`, embeds: [matchFinalEmbed(game!, users, mapData!)]});

            const modLog = await interaction.client.channels.fetch(tokens.ModeratorLogChannel) as TextChannel;
            const embed = new EmbedBuilder();
            embed.setTitle(`Game ${game.matchId} has been manually submitted`);
            embed.setDescription(`<@${interaction.user.id}> has submitted: Team A: ${game.scoreA}, Team B: ${game.scoreB}`);
            await modLog.send({embeds: [embed.toJSON()]});
            await interaction.followUp({ephemeral: false, content: `Match ${game.matchId} has been submitted with:\nTeam A: ${game.scoreA}\nTeam B: ${game.scoreB}`});
        }
        catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'manual_submit',
    allowedRoles: tokens.Mods.concat(tokens.OwnerRole),
}