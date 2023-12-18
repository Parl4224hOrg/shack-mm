import {ActionInt, Actions} from "../database/models/ActionModel";
import {EmbedBuilder} from "discord.js";
import {UserInt} from "../database/models/UserModel";
import moment from "moment";

export const ActionEmbed = (actions: ActionInt[], user: UserInt) => {
    const embed = new EmbedBuilder()
    embed.setTitle(`Actions against ${user.name}`);
    if (moment().unix() > user.banUntil) {
        embed.setDescription(`<@${actions[0].userId}>\nNo current cooldown, Last cooldown was <t:${user.lastBan}:R>\nBan Counter: ${user.banCounter}`);
    } else {
        embed.setDescription(`<@${actions[0].userId}>\nCooldown ends <t:${user.banUntil}:R>\nBan Counter: ${user.banCounter}`);
    }

    for (let action of actions) {
        let title: string;
        if (action.action == Actions.Abandon) {
            title = "Abandon";
        } else if (action.action == Actions.AcceptFail) {
            title = "Fail to Accept";
        } else if (action.action == Actions.Cooldown) {
            title = "Cooldown";
        } else if (action.action == Actions.Nullify) {
            title = "User nullified a match";
        } else if (action.action == Actions.ReverseCooldown) {
            title = "User's cooldown was reversed'";
        } else if (action.action == Actions.ForceScore) {
            title = "User forced a score";
        } else {
            title = "If you see this Parl messed up"
        }
        embed.addFields({
            name: title,
            value: `Action by: <@${action.modId}>\nDate: <t:${action.time}:F>\nReason: ${action.reason}\nData: ${action.actionData}`,
        });
    }
    return embed.toJSON();
}