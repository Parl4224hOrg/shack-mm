import {ChannelType, VoiceState, StageInstancePrivacyLevel} from "discord.js";
import {getVoiceConnection, joinVoiceChannel} from "@discordjs/voice";
import {logWarn} from "../loggers";
import {Data} from "../data";
import tokens from "../tokens";

export const onVoiceUpdate = async (oldState: VoiceState, newState: VoiceState, data: Data) => {
    try {
        if (newState.channel) {
            const canJoin = data.canJoinStream(newState.member!.id);
            const roleIds = newState.member!.roles.cache.map((role) => role.id);
            const isMod = roleIds.some((roleId) => tokens.Mods.includes(roleId));
            const isSpeaker = roleIds.includes(tokens.StreamerRole);
            const isStage = newState.channel.type == ChannelType.GuildStageVoice;
            if (isStage) {
                if (isSpeaker) {
                    const streamerMembers = newState.channel.members.filter((member) => {
                        const hasStreamerRole = member.roles.cache.has(tokens.StreamerRole);
                        return !member.user.bot && hasStreamerRole && member.voice.channelId == newState.channelId;
                    });

                    const isFirstStreamerInChannel = streamerMembers.size == 1 && streamerMembers.has(newState.member!.id);
                    if (isFirstStreamerInChannel) {
                        let botMember = newState.guild.members.me;
                        if (!botMember) {
                            try {
                                botMember = await newState.guild.members.fetchMe();
                            } catch (e) {
                                await logWarn(`voiceUpdateWarn: Unable to fetch bot member: ${e}`, newState.client);
                            }
                        }

                        if (botMember) {
                            if (botMember.voice.channelId != newState.channelId) {
                                try {
                                    const existingConnection = getVoiceConnection(newState.guild.id);
                                    if (existingConnection) {
                                        existingConnection.destroy();
                                    }

                                    joinVoiceChannel({
                                        channelId: newState.channel.id,
                                        guildId: newState.guild.id,
                                        adapterCreator: newState.guild.voiceAdapterCreator,
                                        selfDeaf: false,
                                        selfMute: false,
                                    });
                                } catch (e) {
                                    await logWarn(`voiceUpdateWarn: Bot failed to join stage ${newState.channel.id}: ${e}`, newState.client);
                                }
                            }

                            try {
                                const refreshedBotMember = await newState.guild.members.fetchMe();
                                if (refreshedBotMember.voice.suppress) {
                                    await refreshedBotMember.voice.setSuppressed(false);
                                }
                            } catch (e) {
                                await logWarn(`voiceUpdateWarn: Bot failed to unsuppress in stage ${newState.channel.id}: ${e}`, newState.client);
                            }
                        }
                    }

                    if (!newState.channel.stageInstance) {
                        try {
                            await newState.channel.createStageInstance({
                                privacyLevel: StageInstancePrivacyLevel.GuildOnly,
                                sendStartNotification: false,
                                topic: `${newState.member!.displayName}'s Match Stream`,
                            });
                        } catch (e) {
                            await logWarn(`voiceUpdateWarn: Failed to create stage instance ${newState.channel.id}: ${e}`, newState.client);
                        }
                    }

                    if (newState.suppress) {
                        try {
                            await newState.setSuppressed(false);
                        } catch (e) {
                            await logWarn(`voiceUpdateWarn: Failed to unsuppress streamer ${newState.member!.id}: ${e}`, newState.client);
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
        const nonBotMembers = stage.members.filter((member) => !member.user.bot);
        const botIsAloneInStage = nonBotMembers.size == 0;
        if (!botIsOnlySpeaker || !botIsAloneInStage) {
            continue;
        }

        if (stage.stageInstance) {
            await stage.stageInstance.delete();
        }

        const connection = getVoiceConnection(stage.guild.id);
        if (connection) {
            connection.destroy();
        } else {
            await botMember.voice.disconnect();
        }
    }
}
