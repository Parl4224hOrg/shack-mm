import {StageChannel, VoiceState} from "discord.js";
import {Data} from "../data";
import {logWarn} from "../loggers";
import tokens from "../tokens";

export const onVoiceUpdate = async (oldState: VoiceState, newState: VoiceState, data: Data) => {
    try {
        if (!newState.channelId || !(newState.channel instanceof StageChannel)) {
            return;
        }

        const invite = data.getSpeakerStatus(newState.channelId, newState.member!.id);
        if (newState.requestToSpeakTimestamp == null && invite.canSpeak && newState.suppress) {
            await newState.setSuppressed(false);
        }

        let isMod = false;
        for (let role of newState.member!.roles.cache) {
            if (tokens.Mods.includes(role[0])) {
                isMod = true;
                break;
            }
        }

        if (!invite.canJoin && !isMod) {
            await newState.disconnect("Joined opposing team's stage");
        }
    } catch (e) {
        await logWarn("voiceUpdateError", oldState.client);
    }
}