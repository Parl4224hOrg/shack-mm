import {InternalResponse} from "../interfaces/Internal";
import {Guild, MessageFlagsBitField, TextChannel, User} from "discord.js";
import {getUserByUser} from "../modules/getters/getUser";
import {Data} from "../data";
import {updateUser} from "../modules/updaters/updateUser";
import tokens from "../tokens";
import userModel from "../database/models/UserModel";

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
        const channel = await guild.channels.fetch(tokens.ModChannel) as TextChannel;
        await channel.send({
            content: `<@${dbUser.id}> has registered with an already registered name ${dbUser.oculusName} they have been frozen and instructed to make a ticket\n<@&${tokens.ModRole}>`,
            allowedMentions: {roles: [tokens.ModRole]}
        });
        return {
            success: false,
            message: "There is already a user registered with this name, make a ticket to resolve this issue. You have been frozen"
        }

    }

    if (!registered) {
        const member = await guild.members.fetch(user);
        await member.roles.add(tokens.Player);
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