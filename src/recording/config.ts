import {z} from "zod";
import tokens from "../tokens";

const durationSchema = z.string().regex(/^\d+(ms|s|m|h|d)$/);

const configSchema = z.object({
    postgresConnectionString: z.string().min(1),
    rabbitMqHost: z.string().min(1),
    rabbitMqPort: z.number().int().positive(),
    rabbitMqUsername: z.string().min(1),
    rabbitMqPassword: z.string().min(1),
    rabbitMqVhost: z.string().min(1),
    assignmentQueue: z.string().min(1),
    commandQueuePrefix: z.string().min(1),
    sessionRetentionDuration: durationSchema,
    recorderHeartbeatStaleThreshold: durationSchema,
    startClaimTimeout: durationSchema,
    maxRecordingDuration: durationSchema.optional(),
});

export type RecordingConfig = z.infer<typeof configSchema> & {
    sessionRetentionMs: number;
    recorderHeartbeatStaleThresholdMs: number;
    startClaimTimeoutMs: number;
    maxRecordingDurationMs?: number;
};

export class RecordingConfigError extends Error {
}

export function loadRecordingConfig(): RecordingConfig {
    const recording = tokens.Recording;

    const parsed = configSchema.safeParse({
        postgresConnectionString: recording.PostgresConnectionString,
        rabbitMqHost: recording.RabbitMq.Host,
        rabbitMqPort: recording.RabbitMq.Port,
        rabbitMqUsername: recording.RabbitMq.UserName,
        rabbitMqPassword: recording.RabbitMq.Password,
        rabbitMqVhost: recording.RabbitMq.VirtualHost,
        assignmentQueue: recording.AssignmentQueue,
        commandQueuePrefix: recording.CommandQueuePrefix,
        sessionRetentionDuration: recording.SessionRetentionDuration,
        recorderHeartbeatStaleThreshold: recording.RecorderHeartbeatStaleThreshold,
        startClaimTimeout: recording.StartClaimTimeout,
    });

    if (!parsed.success) {
        throw new RecordingConfigError(`Invalid recording configuration: ${parsed.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`);
    }

    return {
        ...parsed.data,
        sessionRetentionMs: parseDurationMs(parsed.data.sessionRetentionDuration),
        recorderHeartbeatStaleThresholdMs: parseDurationMs(parsed.data.recorderHeartbeatStaleThreshold),
        startClaimTimeoutMs: parseDurationMs(parsed.data.startClaimTimeout),
        maxRecordingDurationMs: parsed.data.maxRecordingDuration ? parseDurationMs(parsed.data.maxRecordingDuration) : undefined,
    };
}

function parseDurationMs(value: string): number {
    const match = value.match(/^(\d+)(ms|s|m|h|d)$/);
    if (!match) {
        throw new RecordingConfigError(`Invalid duration: ${value}`);
    }

    const amount = Number(match[1]);
    const unit = match[2];

    switch (unit) {
        case "ms":
            return amount;
        case "s":
            return amount * 1000;
        case "m":
            return amount * 60 * 1000;
        case "h":
            return amount * 60 * 60 * 1000;
        case "d":
            return amount * 24 * 60 * 60 * 1000;
        default:
            throw new RecordingConfigError(`Invalid duration unit: ${unit}`);
    }
}
