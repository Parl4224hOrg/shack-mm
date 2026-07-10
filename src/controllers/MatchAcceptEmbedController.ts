import {APIEmbed, Message} from "discord.js";

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

export const updateAcceptMessage = async (message: Message, embed: APIEmbed, acceptCount: number) => {
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