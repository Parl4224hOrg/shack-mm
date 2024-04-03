import {SubCommand} from "../../interfaces/Command";
import {cdType, reason, userOption} from "../../utility/options";
import tokens from "../../tokens";
import {logError} from "../../loggers";
import {createActionUser} from "../../modules/constructors/createAction";
import {Actions} from "../../database/models/ActionModel";
import {getUserByUser} from "../../modules/getters/getUser";
import {updateUser} from "../../modules/updaters/updateUser";
import {SlashCommandSubcommandBuilder} from "discord.js";

export const reverseCooldown: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('reverse_cooldown')
        .setDescription('Reverses a cooldown given by a bot')
        .addUserOption(userOption('User to reverse cooldown of'))
        .addStringOption(cdType)
        .addStringOption(reason),
    run: async (interaction, data) => {
        try {
            const dbUser = await getUserByUser(interaction.options.getUser('user', true), data);
            if (interaction.options.getString('type', true) == 'abandon') {
                dbUser.banCounterAbandon--;
                dbUser.banUntil = 0;
                if (dbUser.banCounterAbandon < 0) {
                    dbUser.banCounterAbandon = 0;
                }
            } else {
                dbUser.banCounterFail--;
                dbUser.banUntil = 0;
                if (dbUser.banCounterFail < 0) {
                    dbUser.banCounterFail = 0;
                }
            }
            await updateUser(dbUser, data);
            await interaction.reply({ephemeral: false, content: `<@${dbUser.id}> cooldown of reversed`});
            await createActionUser(Actions.ReverseCooldown, interaction.user.id, dbUser.id, interaction.options.getString('reason', true), 'Bot cooldown reversed');
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'reverse_cooldown',
    allowedRoles: tokens.Mods,
}