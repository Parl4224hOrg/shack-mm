export enum RecordingSessionStatus {
    Pending = 0,
    Starting = 1,
    Recording = 2,
    Stopping = 3,
    Completed = 4,
    Failed = 5,
}

export enum RecorderStatus {
    Available = 0,
    Busy = 1,
    Offline = 2,
}

export enum RecordingTrackType {
    Combined = 0,
    Participant = 1,
}

export type StartRecordingInput = {
    guildId: string;
    voiceChannelId: string;
    textChannelId?: string;
    discordUserIds: string[];
};

export type RecordingSessionDto = {
    id: string;
    guildId: string;
    voiceChannelId: string;
    textChannelId?: string;
    discordUserIds: string[];
    assignedRecorderId?: string;
    status: RecordingSessionStatus;
    statusName: string;
    createdAt: string;
    startedAt?: string;
    stopRequestedAt?: string;
    completedAt?: string;
    expiresAt: string;
    failureReason?: string;
};

export type RecordingTrackDto = {
    id: string;
    sessionId: string;
    type: RecordingTrackType;
    typeName: string;
    discordUserId?: string;
    displayName?: string;
    trackNumber: number;
    storageKey: string;
    fileUrl?: string;
    contentType: string;
    fileSize?: string;
    durationMilliseconds?: string;
    createdAt: string;
    finalizedAt?: string;
};

export type RecorderInstanceDto = {
    id: string;
    status: RecorderStatus;
    statusName: string;
    currentSessionId?: string;
    lastHeartbeatAt: string;
    startedAt: string;
    updatedAt: string;
};

export function recordingStatusName(status: RecordingSessionStatus): string {
    return RecordingSessionStatus[status]?.toLowerCase() ?? `unknown:${status}`;
}

export function recorderStatusName(status: RecorderStatus): string {
    return RecorderStatus[status]?.toLowerCase() ?? `unknown:${status}`;
}

export function trackTypeName(type: RecordingTrackType): string {
    return RecordingTrackType[type]?.toLowerCase() ?? `unknown:${type}`;
}

export function isTerminalRecordingStatus(status: RecordingSessionStatus): boolean {
    return status === RecordingSessionStatus.Completed || status === RecordingSessionStatus.Failed;
}
