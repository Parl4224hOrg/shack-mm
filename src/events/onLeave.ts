import {GuildMember, PartialGuildMember} from "discord.js";
import {Data} from "../data";
import {getUserByUser} from "../modules/getters/getUser";

export const onLeave = async (member: GuildMember | PartialGuildMember, data: Data) => {
    const user = await getUserByUser(member, data);
    data.removeFromAllQueues(user._id);
};
