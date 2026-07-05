import {Pool} from "pg";
import {randomUUID} from "crypto";
import {RecordingConfig} from "./config";
import {
    RecorderInstanceDto,
    RecorderStatus,
    recorderStatusName,
    RecordingSessionDto,
    RecordingSessionStatus,
    RecordingTeam,
    RecordingTrackDto,
    RecordingTrackType,
    recordingStatusName,
    StartRecordingInput,
    trackTypeName,
} from "./types";

type RecordingSessionRow = {
    recording_session_id: string;
    guild_id: string;
    voice_channel_id: string;
    text_channel_id: string | null;
    match_id: number;
    team: number;
    discord_user_ids: string[];
    assigned_recorder_id: string | null;
    status: number;
    created_at: Date;
    started_at: Date | null;
    stop_requested_at: Date | null;
    completed_at: Date | null;
    expires_at: Date;
    failure_reason: string | null;
};

type RecordingTrackRow = {
    recording_track_id: string;
    recording_session_id: string;
    type: number;
    discord_user_id: string | null;
    display_name: string | null;
    track_number: number;
    storage_key: string;
    file_url: string | null;
    content_type: string;
    file_size: string | null;
    duration_milliseconds: string | null;
    created_at: Date;
    finalized_at: Date | null;
};

type RecorderInstanceRow = {
    recorder_instance_id: string;
    status: number;
    current_session_id: string | null;
    last_heartbeat_at: Date;
    started_at: Date;
    updated_at: Date;
};

const ACTIVE_STATUSES = [
    RecordingSessionStatus.Pending,
    RecordingSessionStatus.Starting,
    RecordingSessionStatus.Recording,
    RecordingSessionStatus.Stopping,
];

export class RecordingRepository {
    private readonly pool: Pool;

    constructor(private readonly config: RecordingConfig) {
        this.pool = new Pool({connectionString: config.postgresConnectionString});
    }

    async close(): Promise<void> {
        await this.pool.end();
    }

    async createPendingSession(input: StartRecordingInput): Promise<RecordingSessionDto> {
        const sessionId = randomUUID();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + this.config.sessionRetentionMs);

        const result = await this.pool.query<RecordingSessionRow>(
            `
            insert into vc_records.recording_sessions (
                recording_session_id,
                guild_id,
                voice_channel_id,
                text_channel_id,
                match_id,
                team,
                discord_user_ids,
                status,
                created_at,
                expires_at,
                retention_pinned
            )
            values ($1, $2::bigint, $3::bigint, $4::bigint, $5, $6, $7::bigint[], $8, $9, $10, false)
            returning *
            `,
            [
                sessionId,
                input.guildId,
                input.voiceChannelId,
                input.textChannelId ?? null,
                input.matchId,
                input.team,
                input.discordUserIds,
                RecordingSessionStatus.Pending,
                now,
                expiresAt,
            ],
        );

        return mapSession(result.rows[0]);
    }

    async getSession(sessionId: string): Promise<RecordingSessionDto | null> {
        const result = await this.pool.query<RecordingSessionRow>(
            `select * from vc_records.recording_sessions where recording_session_id = $1`,
            [sessionId],
        );

        return result.rows[0] ? mapSession(result.rows[0]) : null;
    }

    async findActiveSession(guildId: string, voiceChannelId: string): Promise<RecordingSessionDto | null> {
        const result = await this.pool.query<RecordingSessionRow>(
            `
            select *
            from vc_records.recording_sessions
            where guild_id = $1::bigint
              and voice_channel_id = $2::bigint
              and status = any($3::int[])
            order by created_at desc
            limit 1
            `,
            [guildId, voiceChannelId, ACTIVE_STATUSES],
        );

        return result.rows[0] ? mapSession(result.rows[0]) : null;
    }

    async countHealthyAvailableRecorders(): Promise<number> {
        const staleBefore = new Date(Date.now() - this.config.recorderHeartbeatStaleThresholdMs);
        const result = await this.pool.query<{ count: string }>(
            `
            select count(*)::text as count
            from vc_records.recorder_instances
            where status = $1
              and last_heartbeat_at >= $2
            `,
            [RecorderStatus.Available, staleBefore],
        );

        return Number(result.rows[0]?.count ?? "0");
    }

    async listRecorders(): Promise<RecorderInstanceDto[]> {
        const result = await this.pool.query<RecorderInstanceRow>(
            `
            select *
            from vc_records.recorder_instances
            order by recorder_instance_id
            `,
        );

        return result.rows.map(mapRecorder);
    }

    async listTracks(sessionId: string): Promise<RecordingTrackDto[]> {
        const result = await this.pool.query<RecordingTrackRow>(
            `
            select *
            from vc_records.recording_tracks
            where recording_session_id = $1
            order by track_number
            `,
            [sessionId],
        );

        return result.rows.map(mapTrack);
    }

    async markPendingSessionFailed(sessionId: string, failureReason: string): Promise<RecordingSessionDto | null> {
        const result = await this.pool.query<RecordingSessionRow>(
            `
            update vc_records.recording_sessions
            set status = $2,
                failure_reason = $3,
                completed_at = now()
            where recording_session_id = $1
              and status = $4
              and assigned_recorder_id is null
            returning *
            `,
            [sessionId, RecordingSessionStatus.Failed, failureReason, RecordingSessionStatus.Pending],
        );

        return result.rows[0] ? mapSession(result.rows[0]) : null;
    }

    async markOldPendingSessionsFailed(): Promise<number> {
        const staleBefore = new Date(Date.now() - this.config.startClaimTimeoutMs);
        const result = await this.pool.query(
            `
            update vc_records.recording_sessions
            set status = $1,
                failure_reason = coalesce(failure_reason, 'No recorder claimed the session before the timeout'),
                completed_at = now()
            where status = $2
              and assigned_recorder_id is null
              and created_at < $3
            `,
            [RecordingSessionStatus.Failed, RecordingSessionStatus.Pending, staleBefore],
        );

        return result.rowCount ?? 0;
    }
}

function mapSession(row: RecordingSessionRow): RecordingSessionDto {
    const status = row.status as RecordingSessionStatus;
    const team = row.team as RecordingTeam;

    return {
        id: row.recording_session_id,
        guildId: row.guild_id,
        voiceChannelId: row.voice_channel_id,
        textChannelId: row.text_channel_id ?? undefined,
        matchId: row.match_id,
        team,
        discordUserIds: row.discord_user_ids,
        assignedRecorderId: row.assigned_recorder_id ?? undefined,
        status,
        statusName: recordingStatusName(status),
        createdAt: row.created_at.toISOString(),
        startedAt: row.started_at?.toISOString(),
        stopRequestedAt: row.stop_requested_at?.toISOString(),
        completedAt: row.completed_at?.toISOString(),
        expiresAt: row.expires_at.toISOString(),
        failureReason: row.failure_reason ?? undefined,
    };
}

function mapTrack(row: RecordingTrackRow): RecordingTrackDto {
    const type = row.type as RecordingTrackType;

    return {
        id: row.recording_track_id,
        sessionId: row.recording_session_id,
        type,
        typeName: trackTypeName(type),
        discordUserId: row.discord_user_id ?? undefined,
        displayName: row.display_name ?? undefined,
        trackNumber: row.track_number,
        storageKey: row.storage_key,
        fileUrl: row.file_url ?? undefined,
        contentType: row.content_type,
        fileSize: row.file_size ?? undefined,
        durationMilliseconds: row.duration_milliseconds ?? undefined,
        createdAt: row.created_at.toISOString(),
        finalizedAt: row.finalized_at?.toISOString(),
    };
}

function mapRecorder(row: RecorderInstanceRow): RecorderInstanceDto {
    const status = row.status as RecorderStatus;

    return {
        id: row.recorder_instance_id,
        status,
        statusName: recorderStatusName(status),
        currentSessionId: row.current_session_id ?? undefined,
        lastHeartbeatAt: row.last_heartbeat_at.toISOString(),
        startedAt: row.started_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
    };
}
