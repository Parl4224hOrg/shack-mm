import {SlashCommandBuilder} from "@discordjs/builders";
import {MessageFlags, TextChannel} from "discord.js";
import {Command} from "../../interfaces/Command";
import {GameUser} from "../../interfaces/Game";
import {getGameByMatchId} from "../../modules/getters/getGame";
import {getUserById} from "../../modules/getters/getUser";
import {getUserGameStats} from "../../modules/getters/getUserGameStats";
import {getMapData} from "../../utility/match";
import {matchFinalEmbed} from "../../embeds/matchEmbeds";
import {logError} from "../../loggers";
import tokens from "../../tokens";

export const resendScores: Command = {
    data: new SlashCommandBuilder()
        .setName("resend-scores")
        .setDescription("Resends the final score embed for a match")
        .addIntegerOption(option => option
            .setName("match_id")
            .setDescription("Match ID to resend scores for")
            .setRequired(true)
            .setMinValue(1)),
    run: async (interaction, data) => {
        try {
            await interaction.deferReply();

            const matchId = interaction.options.getInteger("match_id", true);
            const game = await getGameByMatchId(matchId);
            if (!game) {
                await interaction.followUp(`Match ${matchId} was not found.`);
                return;
            }

            if (game.scoreA < 0 || game.scoreB < 0) {
                await interaction.followUp(`Match ${matchId} does not have final scores yet.`);
                return;
            }

            const mapData = await getMapData(game.map);
            if (!mapData) {
                await interaction.followUp(`Map data for match ${matchId} was not found.`);
                return;
            }

            const users: GameUser[] = [];
            for (const dbId of game.teamA) {
                const user = await getUserById(dbId, data);
                users.push({
                    dbId,
                    discordId: user.id,
                    team: 0,
                    accepted: true,
                    region: user.region,
                    joined: false,
                    isLate: false,
                    hasBeenGivenLate: false,
                    wasAutoReadied: false,
                });
            }
            for (const dbId of game.teamB) {
                const user = await getUserById(dbId, data);
                users.push({
                    dbId,
                    discordId: user.id,
                    team: 1,
                    accepted: true,
                    region: user.region,
                    joined: false,
                    isLate: false,
                    hasBeenGivenLate: false,
                    wasAutoReadied: false,
                });
            }

            const channel = await interaction.guild!.channels.fetch(tokens.SNDScoreChannel) as TextChannel;
            await channel.send({
                components: [matchFinalEmbed(game, await getUserGameStats(users, game._id), mapData)],
                flags: MessageFlags.IsComponentsV2,
                allowedMentions: {users: []},
            });

            await interaction.followUp(`Resent final scores for match ${matchId}.`);
        } catch (error) {
            await logError(error, interaction);
        }
    },
    name: "resend-scores",
    allowedRoles: tokens.Mods.concat(tokens.AdminRole, tokens.OwnerRole),
};