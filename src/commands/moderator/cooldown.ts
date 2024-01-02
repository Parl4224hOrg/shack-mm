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
import {SlashCommandStringOption} from "discord.js";

export const cooldown: Command = {
    data: new SlashCommandBuilder()
        .setName("cooldown")
        .setDescription("Cooldown a user based on ban counter")
        .addUserOption(userOption("User to cooldown"))
        .addStringOption(new SlashCommandStringOption()
            .setName('action_type')
            .setDescription("Action that was deserving of cooldown")
            .setChoices(
                {
                    name: "Minor Action",
                    value: "0"
                }, {
                    name: "Major Action",
                    value: "2"
                }, {
                    name: "Extenuating Major Action",
                    value: "1"
                }
            )
            .setRequired(true))
        .addStringOption(reason),
    run: async (interaction) => {
        try {
            const user = await getUserByUser(interaction.options.getUser('user', true));
            const now = moment().unix();
            const extra = Number(interaction.options.getString("action_type", true)) ?? 0;
            user.banCounter += extra
            switch (user.banCounter) {
                case 0: user.lastBan = now; user.banUntil = now + 30 * 60; user.lastReduction = now; user.gamesPlayedSinceReduction = 0; break;
                case 1: user.lastBan = now; user.banUntil = now + 8 * 60 * 60; user.lastReduction = now; user.gamesPlayedSinceReduction = 0; break;
                default: user.lastBan = now; user.banUntil = now + 2 ** (user.banCounter - 1) * 12 * 60 * 60; user.lastReduction = now; user.gamesPlayedSinceReduction = 0; break;
            }
            user.banCounter++;
            await updateUser(user);
            let action;
            if (extra == 0) {
                action = "Minor";
            } else if (extra == 1) {
                action = "Extenuating Major"
            } else {
                action = "Major"
            }
            await createAction(Actions.Cooldown, interaction.user.id, interaction.options.getString('reason', true), `Cooldown that scales with ban counter for ${user.banUntil - now} seconds, it was a ${action} action`);
            await interaction.reply({content: `<@${user.id}> has been cooldowned for ${grammaticalTime(user.banUntil - now)}, it was a ${action} action`});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'cooldown',
    allowedRoles: [tokens.ModRole],
}