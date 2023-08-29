import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {reason, timeOption, timeScales, userOption} from "../../utility/options";
import {logError} from "../../loggers";
import {getUserByUser} from "../../modules/getters/getUser";
import moment from "moment";
import {updateUser} from "../../modules/updaters/updateUser";
import {grammaticalTime} from "../../utility/grammatical";
import {createActionUser} from "../../modules/constructors/createAction";
import {Actions} from "../../database/models/ActionModel";
import tokens from "../../tokens";

export const cooldown: Command = {
    data: new SlashCommandBuilder()
        .setName('cooldown')
        .setDescription('Gives a player a cooldown preventing them from playing')
        .addUserOption(userOption('User to give cooldown to'))
        .addStringOption(timeScales)
        .addNumberOption(timeOption)
        .addStringOption(reason),
    run: async (interaction) => {
        try {
            const dbUser = await getUserByUser(interaction.options.getUser('user', true));
            dbUser.lastBan = moment().unix();
            let factor = 60
            switch (interaction.options.getString('time_scale', true)) {
                case 'm': factor = 60; break;
                case 'h': factor = 3600; break;
                case 'd': factor = 86400; break;
                case 'w': factor = 604800; break;
            }
            dbUser.banUntil = moment().unix() + interaction.options.getNumber('time', true) * factor;
            await updateUser(dbUser);
            const time = grammaticalTime(dbUser.banUntil - moment().unix());
            await createActionUser(Actions.Cooldown, interaction.user.id, dbUser.id, interaction.options.getString('reason', true), `cooldown until ${dbUser.banUntil} that is ${time}`);
            await interaction.reply({ephemeral: true, content: `<@${dbUser.id}> was cooldowned for ${time}`});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'cooldown',
    allowedRoles: [tokens.ModRole],
}