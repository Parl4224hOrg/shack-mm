import {Command, SubCommand} from "../../interfaces/Command";
import {Collection} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import {getUserByUser} from "../../modules/getters/getUser";
import {logError} from "../../loggers";
import {easyTime} from "../moderator/easyTime";
import {nullify} from "../moderator/nullify";
import {warn} from "../moderator/warn";
import {forceAbandon} from "../moderator/forceAbandon";
import {refMute} from "../moderator/refMute";

export const subCommandListTemp: SubCommand[] = [easyTime, warn, nullify, forceAbandon, refMute];
let SubCommandMap: Collection<string, SubCommand> = new Collection<string, SubCommand>();
for (let subCommand of subCommandListTemp) {
    SubCommandMap.set(subCommand.name, subCommand);
}

const SubCommandList = SubCommandMap;

export const _ref: Command = {
    data: new SlashCommandBuilder()
        .setName('ref')
        .setDescription('Referee Commands')
        .addSubcommand(easyTime.data)
        .addSubcommand(nullify.data)
        .addSubcommand(warn.data)
        .addSubcommand(forceAbandon.data)
        .addSubcommand(refMute.data)
    ,
    run: async (interaction, data) => {
        try {
            const command = SubCommandList.get(interaction.options.getSubcommand())!
            const dbUser = await getUserByUser(interaction.user, data);
            if (dbUser.referee) {
                await command.run(interaction, data);
            } else {
                await interaction.reply({ephemeral: true, content: "You do not have permission to use this command"})
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'ref',
}
