import {ActionInt, Actions} from "../database/models/ActionModel";
import {EmbedBuilder, EmbedField} from "discord.js";
import {UserInt} from "../database/models/UserModel";
import moment from "moment";

export const ActionEmbed = (actions: ActionInt[], user: UserInt) => {
    const embed = new EmbedBuilder()
    embed.setTitle(`Actions against ${user.name}`);
    const frozen = `The user is currently ${user.frozen ? "frozen" : "not frozen"}`;
    if (actions.length == 0) {
        embed.setDescription("User has no actions");
        return embed.toJSON();
    }
    const time = moment().unix();
    let desc = "";
    // Add cooldown info
    if (time > user.banUntil) {
        desc += `<${actions[0].userId}>\nNo current cooldown, Last cooldown was <t:${user.lastBan}:R>\n`;
    } else {
        desc += `<${actions[0].userId}>\nCooldown ends <t:${user.banUntil}:R>\n`;
    }
    // Add ban counter info
    desc += `Ban Counter Abandon: ${user.banCounterAbandon}\nBan Counter fail to accept: ${user.banCounterFail}\n${frozen}`;
    // Add mute info
    if (user.muteUntil < 0) {
        desc += "User is muted indefinitely\n";
    } else if (time > user.muteUntil) {
        desc += "User is not muted\n";
    } else {
        desc += `User is muted until <t:${user.muteUntil}:R>\n`;
    }

    let truncatedActions: ActionInt[];

    let notShown = 0;
    if (actions.length > 25) {
        notShown = actions.length - 25;
        truncatedActions = actions.slice(actions.length - 25, actions.length);
    } else {
        truncatedActions = actions;
    }

    let fields: EmbedField[] = [];

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
        } else if (action.action == Actions.ManualSubmit) {
            title = "Match was manually submitted";
        } else if (action.action == Actions.Freeze) {
            title = "Freeze"
        } else {
            title = "If you see this Parl messed up"
        }
        let content = `Action by: <@${action.modId}>\nDate: <t:${action.time}:F>\nReason: ${action.reason}\nData: ${action.actionData}`;
        if (content.length > 1024) {
            content = `Action by: <@${action.modId}>\nDate: <t:${action.time}:F>\nReason: Too many characters not shown\nData: ${action.actionData}`;
        }
        fields.push({
            name: title,
            value: content,
            inline: false,
        });
    }
    embed.setFields(fields);
    while (embed.length + desc.length + 39> 6000) {
        console.log("here")
        fields = fields.slice(1, fields.length);
        embed.setFields(fields);
        notShown++;
    }
    desc += `\nThere are ${notShown} older actions not shown`;
    embed.setDescription(desc);
    return embed.toJSON();
}
