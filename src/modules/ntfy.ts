import axios from "axios";
import {v4 as uuidV4} from "uuid";
import {Client} from "discord.js";
import UserModel, {UserInt} from "../database/models/UserModel";
import type {Data} from "../data";
import {updateUser} from "./updaters/updateUser";
import {logInfo} from "../loggers";

export const NTFY_BASE_URL = "https://ntfy.sh";

const missingNtfyIdQuery = {
    $or: [{ntfyId: {$exists: false}}, {ntfyId: null}, {ntfyId: ""}],
};

export const createNtfyId = (): string => uuidV4();

export const ensureNtfyId = async (user: UserInt, data?: Data): Promise<UserInt> => {
    if (user.ntfyId) {
        return user;
    }
    user.ntfyId = createNtfyId();
    return updateUser(user, data);
};

export const backfillNtfyIds = async (client: Client): Promise<void> => {
    const missing = await UserModel.find(missingNtfyIdQuery).select("_id id");
    if (missing.length > 0) {
        const ops = missing.map((user) => ({
            updateOne: {
                filter: {_id: user._id},
                update: {$set: {ntfyId: createNtfyId()}},
            },
        }));
        const batchSize = 500;
        for (let i = 0; i < ops.length; i += batchSize) {
            await UserModel.bulkWrite(ops.slice(i, i + batchSize));
        }
        await logInfo(`Backfilled ntfyId for ${missing.length} users`, client);
    }
    await UserModel.collection.createIndex({ntfyId: 1}, {unique: true, sparse: true});
};

export const postNtfyNotification = async (
    ntfyId: string,
    message: string,
    click: string,
    priority: string,
    title: string,
): Promise<void> => {
    await axios.post(`${NTFY_BASE_URL}/${ntfyId}`, message, {
        timeout: 3_000,
        headers: {
            Title: title,
            Click: click,
            Priority: priority,
        },
    });
};
