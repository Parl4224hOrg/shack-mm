import {InternalResponse} from "../interfaces/Internal";
import {Guild, MessageFlagsBitField, TextChannel, User} from "discord.js";
import {getUserByUser} from "../modules/getters/getUser";
import {Data} from "../data";
import {updateUser} from "../modules/updaters/updateUser";
import tokens from "../tokens";
import userModel from "../database/models/UserModel";
import moment from "moment";

export const handleRegister = async (name: string, user: User, data: Data, guild: Guild): Promise<InternalResponse> => {

    const dbUser = await getUserByUser(user, data);
    let registered = true;
    if (dbUser.oculusName == null) {
        registered = false;
    }
    dbUser.oculusName = name.replace("<@", "").replace(">", "");
    await updateUser(dbUser, data);

    const matchedNames = await userModel.find({oculusName: dbUser.oculusName, transferred: false});
    if (matchedNames.length > 1) {
        dbUser.frozen = true;
        await updateUser(dbUser, data);
        const now = moment().unix();
        let otherAccounts = "";
        for (const matchedName of matchedNames) {
            if (matchedName.id != dbUser.id) {
                otherAccounts += `\n<@${matchedName.id}>: Frozen: ${matchedName.frozen}, Muted: ${matchedName.muteUntil > now ? `<t:${matchedName.muteUntil}:F>` : matchedName.muteUntil < 0 ? "Perma" : "No"}`;
            }
        }

        const channel = await guild.channels.fetch(tokens.PotentialAltsChannel) as TextChannel;
        await channel.send({
            content: `
            <@${dbUser.id}> has registered with an already registered name ${dbUser.oculusName} they have been frozen and instructed to make a ticket\n<@&${tokens.ModRole}>
            Name: ${name}
            Other Accounts:${otherAccounts}   
            `,
            allowedMentions: {roles: [tokens.ModRole]}
        });
        return {
            success: false,
            message: "There is already a user registered with this name, make a ticket to resolve this issue. You have been frozen"
        }

    }
    const member = await guild.members.fetch(user);
    await member.roles.add(tokens.Player);

    if (!registered) {
        return {
            success: true,
            message: `You have registered please go to <#${tokens.RegionSelect}> to select your region`,
            flags: MessageFlagsBitField.Flags.Ephemeral
        }
    } else {
        return {
            success: true,
            message: "You have updated your registered name",
            flags: MessageFlagsBitField.Flags.Ephemeral
        }
    }
}