import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {reason, userOption} from "../../utility/options";
import {logError} from "../../loggers";
import tokens from "../../tokens";
import moment from "moment";
import {updateUser} from "../../modules/updaters/updateUser";
import {getUserByUser} from "../../modules/getters/getUser";
import {grammaticalTime} from "../../utility/grammatical";
import {createAction} from "../../modules/constructors/createAction";
import {Actions} from "../../database/models/ActionModel";

export const autoCD: Command = {
    data: new SlashCommandBuilder()
        .setName("auto_cd")
        .setDescription("Cooldown a user based on ban counter")
        .addUserOption(userOption("User to cooldown"))
        .addStringOption(reason),
    run: async (interaction) => {
        try {
            const user = await getUserByUser(interaction.options.getUser('user', true));
            const now = moment().unix();
            switch (user.banCounter) {
                case 0: user.lastBan = now; user.banUntil = now + 30 * 60; break;
                case 1: user.lastBan = now; user.banUntil = now + 60 * 60; break;
                case 2: user.lastBan = now; user.banUntil = now + 8 * 60 * 60; break;
                case 3: user.lastBan = now; user.banUntil = now + 24 * 60 * 60; break;
                case 4: user.lastBan = now; user.banUntil = now + 48 * 60 * 60; break;
                case 5: user.lastBan = now; user.banUntil = now + 96 * 60 * 60; break;
                default: user.lastBan = now; user.banUntil = now + 192 * 60 * 60; break;
            }
            user.banCounter++;
            await updateUser(user);
            await createAction(Actions.Cooldown, interaction.user.id, interaction.options.getString('reason', true), `Cooldown that scales with ban counter for ${user.banUntil - now} seconds`);
            await interaction.reply({content: `<@${user.id}> has been cooldowned for ${grammaticalTime(user.banUntil - now)}`});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'auto_cd',
    allowedRoles: [tokens.ModRole],
}