import cron from "node-cron";
import {z} from "zod";
import {RecordingBus} from "./bus";
import {loadRecordingConfig, RecordingConfig} from "./config";
import {RecordingRepository} from "./repository";
import {isTerminalRecordingStatus, RecordingSessionDto, RecordingSessionStatus, RecordingTeam, StartRecordingInput} from "./types";

const snowflakeSchema = z.string().regex(/^\d{1,20}$/);
const uuidSchema = z.string().uuid();

const startRecordingSchema = z.object({
    guildId: snowflakeSchema,
    voiceChannelId: snowflakeSchema,
    textChannelId: snowflakeSchema.optional(),
    matchId: z.number().int().nonnegative(),
    team: z.nativeEnum(RecordingTeam),
    discordUserIds: z.array(snowflakeSchema).min(1),
});

export class RecordingService {
    private readonly repository: RecordingRepository;
    private readonly bus: RecordingBus;
    private readonly pendingTimeouts = new Map<string, NodeJS.Timeout>();
    private readonly cleanupTask = cron.schedule("*/30 * * * * *", async () => {
        try {
            const failedCount = await this.repository.markOldPendingSessionsFailed();
            if (failedCount > 0) {
                console.log(`Marked ${failedCount} stale pending recording session(s) as failed`);
            }
        } catch (error) {
            console.error("Failed to clean up stale pending recording sessions", error);
        }
    }, {runOnInit: false});

    constructor(readonly config: RecordingConfig = loadRecordingConfig()) {
        this.repository = new RecordingRepository(config);
        this.bus = new RecordingBus(config);
        this.cleanupTask.start();
    }

    async close(): Promise<void> {
        this.cleanupTask.stop();
        for (const timeout of this.pendingTimeouts.values()) {
            clearTimeout(timeout);
        }
        this.pendingTimeouts.clear();
        await this.bus.close();
        await this.repository.close();
    }

    async startRecording(input: StartRecordingInput): Promise<RecordingSessionDto> {
        const validated = startRecordingSchema.parse(input);

        const activeSession = await this.repository.findActiveSession(validated.guildId, validated.voiceChannelId);
        if (activeSession) {
            throw new Error(`A recording is already active for this voice channel: ${activeSession.id}`);
        }

        const availableRecorderCount = await this.repository.countHealthyAvailableRecorders();
        if (availableRecorderCount < 1) {
            throw new Error("No healthy available recorder bots are online");
        }

        const session = await this.repository.createPendingSession(validated);

        try {
            await this.bus.publishStartAssignment(session.id, validated);
            console.log(`Published recording assignment ${session.id}`);
        } catch (error) {
            await this.repository.markPendingSessionFailed(session.id, "Failed to publish recorder assignment");
            throw error;
        }

        this.watchPendingClaim(session.id);
        return session;
    }

    async stopRecording(sessionId: string): Promise<RecordingSessionDto> {
        const id = uuidSchema.parse(sessionId);
        const session = await this.repository.getSession(id);

        if (!session) {
            throw new Error("Recording session was not found");
        }

        if (isTerminalRecordingStatus(session.status)) {
            return session;
        }

        if (!session.assignedRecorderId) {
            const failed = await this.repository.markPendingSessionFailed(id, "Stopped before recorder assignment");
            return failed ?? await this.getRequiredSession(id);
        }

        await this.bus.publishStopCommand(id, session.assignedRecorderId);
        console.log(`Published recording stop command ${id} to ${session.assignedRecorderId}`);
        return await this.getRequiredSession(id);
    }

    async stopActiveRecordingForVoiceChannel(guildId: string, voiceChannelId: string): Promise<RecordingSessionDto | null> {
        const session = await this.repository.findActiveSession(
            snowflakeSchema.parse(guildId),
            snowflakeSchema.parse(voiceChannelId),
        );

        if (!session) {
            return null;
        }

        return await this.stopRecording(session.id);
    }

    async getSession(sessionId: string): Promise<RecordingSessionDto | null> {
        return await this.repository.getSession(uuidSchema.parse(sessionId));
    }

    async listTracks(sessionId: string) {
        return await this.repository.listTracks(uuidSchema.parse(sessionId));
    }

    async listRecorders() {
        return await this.repository.listRecorders();
    }

    private async getRequiredSession(sessionId: string): Promise<RecordingSessionDto> {
        const session = await this.repository.getSession(sessionId);
        if (!session) {
            throw new Error("Recording session was not found");
        }
        return session;
    }

    private watchPendingClaim(sessionId: string): void {
        const timeout = setTimeout(async () => {
            this.pendingTimeouts.delete(sessionId);
            const session = await this.repository.getSession(sessionId);
            if (!session || session.status !== RecordingSessionStatus.Pending) {
                return;
            }

            await this.repository.markPendingSessionFailed(sessionId, "No recorder claimed the session before the timeout");
        }, this.config.startClaimTimeoutMs);

        this.pendingTimeouts.set(sessionId, timeout);
    }
}
