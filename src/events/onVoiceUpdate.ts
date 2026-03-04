import {ChannelType, VoiceState, StageInstancePrivacyLevel} from "discord.js";
import {logInfo, logWarn} from "../loggers";
import {Data} from "../data";
import tokens from "../tokens";

export const onVoiceUpdate = async (oldState: VoiceState, newState: VoiceState, data: Data) => {
    try {
        if (newState.channel) {
            const canJoin = data.canJoinStream(newState.member!.id);
            const roleIds = newState.member!.roles.cache.map((role) => role.id);
            const isMod = roleIds.some((roleId) => tokens.Mods.includes(roleId));
            const isSpeaker = roleIds.includes(tokens.StreamerRole);
            await logInfo(`${newState.member?.id}: IsSpeaker: ${isSpeaker} IsMod: ${isMod}`, data.client);
            const isStage = newState.channel.type == ChannelType.GuildStageVoice;
            if (isStage) {
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
                        const streamerMembers = newState.channel.members.filter((member) => {
                            const hasStreamerRole = member.roles.cache.has(tokens.StreamerRole);
                            return !member.user.bot && hasStreamerRole && member.voice.channelId == newState.channelId;
                        });

                        if (streamerMembers.size == 1 && streamerMembers.has(newState.member!.id)) {
                            if (botMember.voice.channelId != newState.channelId) {
                                await botMember.voice.setChannel(newState.channel);
                            }

                            await newState.guild.members.fetchMe();
                            const refreshedBotMember = newState.guild.members.me;
                            if (refreshedBotMember && refreshedBotMember.voice.suppress) {
                                await refreshedBotMember.voice.setSuppressed(false);
                            }
                        }
                    }
                }
            }

            if (!canJoin && !isMod && !isSpeaker) {
                await newState.disconnect("Joined opposing team's stage");
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
