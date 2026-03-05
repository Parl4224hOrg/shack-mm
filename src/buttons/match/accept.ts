import {Button} from "../../interfaces/Button";
import {ButtonBuilder} from "@discordjs/builders";
import {APIEmbed, ButtonStyle, Message, MessageFlagsBitField} from "discord.js";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {acceptLimiter} from "../../utility/limiters";
import {gameEmbed} from "../../embeds/matchEmbeds";

const EDIT_COOLDOWN = 5000;

type EditState = {
    lastEditAt: number;
    lastAcceptCount: number;
    pendingEmbed: APIEmbed | null;
    timer: NodeJS.Timeout | null;
}

const editStates = new Map<string, EditState>();

const flushMessageEmbedEdit = async (message: Message, acceptCount: number) => {
    const state = editStates.get(message.id);
    if (!state || !state.pendingEmbed) return;

    const now = Date.now();
    const elapsed = now - state.lastEditAt;

    if (acceptCount <= state.lastAcceptCount) {
        state.pendingEmbed = null;
        if (state.timer) {
            clearTimeout(state.timer);
            state.timer = null;
        }
        return;
    }

    if (elapsed < EDIT_COOLDOWN) {
        if (!state.timer) {
            state.timer = setTimeout(async () => {
                const s = editStates.get(message.id);
                if (s) s.timer = null;
                await flushMessageEmbedEdit(message, acceptCount);
            }, EDIT_COOLDOWN - elapsed);
        }
        return;
    }

    const nextEmbed = state.pendingEmbed;
    state.pendingEmbed = null;

    await message.edit({embeds: [nextEmbed]});
    state.lastEditAt = Date.now();
    state.lastAcceptCount = acceptCount;

    // schedule next update in case something was queued during the edit
    if (state.pendingEmbed) {
        await flushMessageEmbedEdit(message, acceptCount);
    }
}

const updateAcceptMessage = async (message: Message, embed: APIEmbed, acceptCount: number) => {
    const state = editStates.get(message.id) ?? {
        lastEditAt: 0,
        lastAcceptCount: 0,
        pendingEmbed: null,
        timer: null,
    };
    editStates.set(message.id, state);

    state.pendingEmbed = embed;

    await flushMessageEmbedEdit(message, acceptCount);
}

export const accept: Button = {
    data: new ButtonBuilder()
        .setLabel("Accept")
        .setStyle(ButtonStyle.Success)
        .setCustomId('match-accept'),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.user, data);
            const controller = data.findController();
            if (controller) {
                const response = await controller.acceptGame(dbUser._id);
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: response.message});
                const game = controller.findGame(dbUser._id);
                if (game) {
                    await updateAcceptMessage(interaction.message, gameEmbed(game), game.getUsers().reduce((total, user) => {
                        if (user.accepted) {
                            return total + 1;
                        }
                        return total;
                    }, 0));
                }
            } else {
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "Could not find controller please contact a mod"})
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    id: 'match-accept',
    limiter: acceptLimiter,
}