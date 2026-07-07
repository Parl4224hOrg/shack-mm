import amqp, {ChannelModel, ConfirmChannel} from "amqplib";
import {RecordingConfig} from "./config";
import {StartRecordingInput} from "./types";

export class RecordingBus {
    private connection?: ChannelModel;
    private channel?: ConfirmChannel;

    constructor(private readonly config: RecordingConfig) {
    }

    async close(): Promise<void> {
        await this.channel?.close();
        await this.connection?.close();
    }

    async publishStartAssignment(sessionId: string, input: StartRecordingInput): Promise<void> {
        const channel = await this.getChannel();
        const payload = {
            SessionId: sessionId,
            GuildId: input.guildId,
            VoiceChannelId: input.voiceChannelId,
            MatchId: input.matchId,
            Team: input.team,
            DiscordUserIds: input.discordUserIds,
        };

        await channel.assertQueue(this.config.assignmentQueue, {durable: true});
        await this.sendToQueue(channel, this.config.assignmentQueue, payload, sessionId);
    }

    async publishStopCommand(sessionId: string, recorderId: string): Promise<void> {
        await this.publishRecorderCommand(sessionId, recorderId, "stop_recording");
    }

    async publishPauseCommand(sessionId: string, recorderId: string): Promise<void> {
        await this.publishRecorderCommand(sessionId, recorderId, "pause_recording");
    }

    async publishResumeCommand(sessionId: string, recorderId: string): Promise<void> {
        await this.publishRecorderCommand(sessionId, recorderId, "resume_recording");
    }

    private async publishRecorderCommand(sessionId: string, recorderId: string, command: string): Promise<void> {
        const channel = await this.getChannel();
        const queue = `${this.config.commandQueuePrefix}.${recorderId}`;

        await channel.assertQueue(queue, {durable: true});
        await this.sendToQueue(channel, queue, {
            command,
            sessionId,
        }, sessionId);
    }

    private async getChannel(): Promise<ConfirmChannel> {
        if (this.channel) {
            return this.channel;
        }

        const url = `amqp://${encodeURIComponent(this.config.rabbitMqUsername)}:${encodeURIComponent(this.config.rabbitMqPassword)}@${this.config.rabbitMqHost}:${this.config.rabbitMqPort}/${encodeURIComponent(this.config.rabbitMqVhost)}`;

        this.connection = await amqp.connect(url);
        this.channel = await this.connection.createConfirmChannel();
        return this.channel;
    }

    private sendToQueue(channel: ConfirmChannel, queue: string, payload: unknown, correlationId: string): Promise<void> {
        const body = Buffer.from(JSON.stringify(payload));

        return new Promise((resolve, reject) => {
            channel.sendToQueue(queue, body, {
                contentType: "application/json",
                deliveryMode: 2,
                correlationId,
            }, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }
}
