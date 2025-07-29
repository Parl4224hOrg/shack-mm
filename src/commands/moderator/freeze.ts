import {SubCommand} from "../../interfaces/Command";
import {userOption} from "../../utility/options";
import {logError, logInfo} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import {updateUser} from "../../modules/updaters/updateUser";
import tokens from "../../tokens";
import {MessageFlagsBitField, SlashCommandSubcommandBuilder} from "discord.js";
import {createActionUser} from "../../modules/constructors/createAction";
import {Actions} from "../../database/models/ActionModel";
import moment from "moment-timezone";
import Tokens from "../../tokens";

export const freeze: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('freeze')
        .setDescription("Freezes a user")
        .addUserOption(userOption("User to freeze")),
    run: async (interaction, data) => {
        try {
            if (interaction.channel!.isThread()) {
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "This command cannot be used in a thread please use it in the ticket itself"})
            } else {
                await interaction.deferReply();
                const dbUser = await getUserByUser(interaction.options.getUser('user', true), data);
                const guild = await interaction.client.guilds.fetch(tokens.GuildID);
                const member = await guild.members.fetch(dbUser.id);
                dbUser.frozen = !dbUser.frozen;
                
                if (dbUser.frozen) {
                    await createActionUser(Actions.Freeze, interaction.user.id, dbUser.id, "User was frozen", "User was frozen");
                    await updateUser(dbUser, data);
                    data.removeFromQueue(dbUser._id, "ALL");
                    if (member) {
                        await member.roles.add(tokens.MutedRole);
                        await interaction.followUp({content: `<@${dbUser.id}> has been frozen`});
                    } else {
                        await interaction.followUp({content: `<@${dbUser.id}> : ${dbUser.name} has been frozen, unable to find in server to apply mute role.`});
                    }
                } else {
                    await createActionUser(Actions.Freeze, interaction.user.id, dbUser.id, "User was un-frozen", "User was un-frozen");
                    await updateUser(dbUser, data);
                    if (dbUser.muteUntil > 0 && dbUser.muteUntil < moment().unix()) {
                        if (member) {
                            await member.roles.remove(tokens.MutedRole, "remove using /freeze");
                            await logInfo(`Unmuted ${member.user.id} (${dbUser.id}) freeze.ts ln 39`, interaction.client, [Tokens.Parl]);
                        }
                    }
                    await interaction.followUp({content: `<@${dbUser.id}> has been unfrozen, and unmuted if in server.`});
                }
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'freeze',
    allowedRoles: tokens.Mods,
}
