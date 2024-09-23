import {ChannelType, VoiceState} from "discord.js";
import {logWarn} from "../loggers";
import {Data} from "../data";
import tokens from "../tokens";

export const onVoiceUpdate = async (oldState: VoiceState, newState: VoiceState, data: Data) => {
    try {
        if (newState.channel) {
            const canJoin = data.canJoinStream(newState.member!.id);
            let isMod = false;
            let isSpeaker = false;
            for (let role of newState.member!.roles.cache) {
                if (tokens.Mods.includes(role[0])) {
                    isMod = true;
                    break;
                }
                if (tokens.StreamerRole == role[0]) {
                    isSpeaker = true;
                }
            }
            const isStage = newState.channel.type == ChannelType.GuildStageVoice;
            if (isStage && newState.requestToSpeakTimestamp == null) {
                if (isSpeaker && newState.suppress) {
                    await newState.setSuppressed(false);
                }
            }

            if (!canJoin && !isMod && !isSpeaker) {
                await newState.disconnect("Joined opposing team's stage");
            }
        }
    } catch (e) {
        await logWarn(`voiceUpdateError:\n${e}`, oldState.client);
    }
}