import {ActionInt, Actions} from "../database/models/ActionModel";
import {EmbedBuilder} from "discord.js";
import {UserInt} from "../database/models/UserModel";
import moment from "moment";

export const ActionEmbed = (actions: ActionInt[], user: UserInt) => {
    const embed = new EmbedBuilder()
    embed.setTitle(`Actions against ${user.name}: ${user.oculusName}`);
    const frozen = `The user is currently ${user.frozen ? "frozen" : "not frozen"}`;
    if (actions.length == 0) {
        embed.setDescription("User has no actions");
        return embed.toJSON();
    }
    let desc = ""
    if (moment().unix() > user.banUntil) {
        desc += `<@${actions[0].userId}>\nNo current cooldown, Last cooldown was <t:${user.lastBan}:R>\nBan Counter Abandon: ${user.banCounterAbandon}\nBan Counter fail to accept: ${user.banCounterFail}\n${frozen}`;
    } else {
        desc += `<@${actions[0].userId}>\nCooldown ends <t:${user.banUntil}:R>\nBan Counter Abandon: ${user.banCounterAbandon}\nBan Counter fail to accept: ${user.banCounterFail}\n${frozen}`;
    }

    let truncatedActions: ActionInt[];

    if (actions.length > 25) {
        desc += `\nThere are ${actions.length - 25} older actions not shown`;
        truncatedActions = actions.slice(actions.length - 25, actions.length);
    } else {
        truncatedActions = actions;
    }

    for (let action of truncatedActions) {
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
        } else if (action.action == Actions.RemoveCooldown) {
            title = "User's cooldown was removed";
        } else {
            title = "If you see this Parl messed up"
        }
        embed.addFields({
            name: title,
            value: `Action by: <@${action.modId}>\nDate: <t:${action.time}:F>\nReason: ${action.reason}\nData: ${action.actionData}`,
        });
    }
    embed.setDescription(desc);
    return embed.toJSON();
}