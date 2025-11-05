import {Command, SubCommand} from "../../interfaces/Command";
import {Collection, MessageFlagsBitField} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import {getUserByUser} from "../../modules/getters/getUser";
import {logError} from "../../loggers";
import {refMute} from "./refMute";
import { refForceAbandon } from "./refForceAbandon";
import { refWarn } from "./refWarn";
import { refNullify } from "./refNullify";
import { refEasyTime } from "./refEasyTime";

export const subCommandListTemp: SubCommand[] = [refEasyTime, refNullify, refWarn, refForceAbandon, refMute];
let SubCommandMap: Collection<string, SubCommand> = new Collection<string, SubCommand>();
for (let subCommand of subCommandListTemp) {
    SubCommandMap.set(subCommand.name, subCommand);
}

const SubCommandList = SubCommandMap;

export const _ref: Command = {
    data: new SlashCommandBuilder()
        .setName('ref')
        .setDescription('Referee Commands')
        .addSubcommand(refEasyTime.data)
        .addSubcommand(refNullify.data)
        .addSubcommand(refWarn.data)
        .addSubcommand(refForceAbandon.data)
        .addSubcommand(refMute.data)
    ,
    run: async (interaction, data) => {
        try {
            const command = SubCommandList.get(interaction.options.getSubcommand())!
            const dbUser = await getUserByUser(interaction.user, data);
            if (dbUser.referee) {
                await command.run(interaction, data);
            } else {
                await interaction.reply({flags: MessageFlagsBitField.Flags.Ephemeral, content: "You do not have permission to use this command"})
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'ref',
}
