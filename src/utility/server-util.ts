import {Regions} from "../database/models/UserModel";
import serverModel, {ServerInt} from "../database/models/ServerModel";

export const getServerReservation = async (allowedRegions: Regions[], reservedBy: string): Promise<ServerInt | null> => {
    const servers = await serverModel.find({region: {$in: allowedRegions}, reserved: false}).exec();

    let server: ServerInt | null = null;
    for (const region of allowedRegions) {
        for (const candidate of servers) {
            if (candidate.region == region) {
                const updated = await serverModel.findOneAndUpdate(
                    {_id: candidate._id, v: candidate.v},
                    {
                        $set: {
                            reservedBy: reservedBy,
                            reserved: true,
                        },
                        $inc: {v: 1}
                    },
                    {
                        sort: { priority: -1, load: 1 },
                        returnDocument: "after"
                    }
                );
                if (!updated) continue;
                server = updated;
                break;
            }
        }
    }
    return server;
}

export const releaseServerReservation = async (id: string): Promise<boolean> => {
    const updated = await serverModel.findOneAndUpdate(
        {_id: id},
        {
            $set: {
                reservedBy: "",
                reserved: false,
            },
            $inc: {v: 1}
        },
        {}
    );
    return !!updated;
}