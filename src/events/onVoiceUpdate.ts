import {ChannelType, VoiceState, StageInstancePrivacyLevel} from "discord.js";
import {logInfo, logWarn} from "../loggers";
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
            await logInfo(`${newState.member?.id}: IsSpeaker: ${isSpeaker} IsMod: ${isMod}`, data.client);
            const isStage = newState.channel.type == ChannelType.GuildStageVoice;
            if (isStage && newState.requestToSpeakTimestamp == null) {
                if (isSpeaker && newState.suppress && !newState.channel.stageInstance) {
                    await newState.channel.createStageInstance({
                        privacyLevel: StageInstancePrivacyLevel.GuildOnly,
                        sendStartNotification: false,
                        topic: `${newState.member!.displayName}'s Match Stream`,
                    });
                    await newState.setSuppressed(false);
                } else if (isSpeaker && newState.suppress) {
                    await newState.setSuppressed(false);
                }

                if (isSpeaker) {
                    const botMember = newState.guild.members.me;
                    if (botMember) {
                        const memberSpeakers = newState.channel.members.filter((member) => {
                            const voiceState = member.voice;
                            return !member.user.bot && !voiceState.suppress && voiceState.channelId == newState.channelId;
                        });

                        if (memberSpeakers.size == 1 && memberSpeakers.has(newState.member!.id)) {
                            if (botMember.voice.channelId != newState.channelId) {
                                await botMember.voice.setChannel(newState.channel);
                            }
                            if (botMember.voice.suppress) {
                                await botMember.voice.setSuppressed(false);
                            }
                        }
                    }
                }
            }

            if (!canJoin && !isMod && !isSpeaker) {
                await newState.disconnect("Joined opposing team's stage");
            }
        } else {
            if (!oldState.channel) {
                return;
            }
            if (oldState.channel.type == ChannelType.GuildStageVoice) {
                if (oldState.channel.stageInstance) {
                    const extracted = oldState.channel.stageInstance.topic.split(" Match")[0]
                    if (extracted.slice(0, extracted.length - 2) == oldState.member!.displayName) {
                        await oldState.channel.stageInstance.delete();
                    }
                }

            }
        }

        await leaveIfBotOnlySpeaker(oldState, newState);
    } catch (e) {
        await logWarn(`voiceUpdateError:\n${e}`, oldState.client);
    }
}

const leaveIfBotOnlySpeaker = async (oldState: VoiceState, newState: VoiceState) => {
    const stageCandidates = [newState.channel, oldState.channel].filter(
        (channel) => channel?.type == ChannelType.GuildStageVoice
    );

    for (const stage of stageCandidates) {
        const botMember = stage.guild.members.me;
        if (!botMember || botMember.voice.channelId != stage.id) {
            continue;
        }

        const unsuppressedMembers = stage.members.filter((member) => !member.voice.suppress);
        const botIsOnlySpeaker = unsuppressedMembers.size == 1 && unsuppressedMembers.has(botMember.id);
        if (!botIsOnlySpeaker) {
            continue;
        }

        if (stage.stageInstance) {
            await stage.stageInstance.delete();
        }

        await botMember.voice.disconnect();
    }
}
