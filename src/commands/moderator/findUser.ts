import {SubCommand} from "../../interfaces/Command";
import {SlashCommandStringOption, SlashCommandSubcommandBuilder} from "discord.js";
import {logError} from "../../loggers";
import UserModel, {UserInt} from "../../database/models/UserModel";
import {getEditDistance} from "../../utility/grammatical";
import discordTokens from "../../config/discordTokens";

export const findUser: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName("find_user")
        .setDescription("Finds a user's discord based off of a close ign")
        .addStringOption(new SlashCommandStringOption()
            .setName('name')
            .setDescription("A close spelling of the user's ign")
            .setRequired(true)),
    run: async (interaction) => {
        try {
            await interaction.deferReply({ephemeral: true});
            const name = interaction.options.getString('name', true);
            const users: UserInt[] = await UserModel.find();
            const computed: {user: UserInt, value: number}[] = [];
            for (let user of users) {
                const difference = getEditDistance(name, user.oculusName);
                computed.push({user: user, value: difference});
            }
            computed.sort((a, b) => {return a.value - b.value});
            let choices = "Here are the top matches for the provided name"
            for (let user of computed.slice(0, 10)) {
                choices += `\n<@${user.user.id}>: ${user.user.oculusName}`;
            }
            await interaction.followUp({ephemeral: true, content: choices});
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'find_user',
    allowedRoles: discordTokens.Moderators,
}