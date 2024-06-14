import {Command, SubCommand} from "../../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {logError} from "../../../loggers";
import {clear} from "./clear";
import {Collection} from "discord.js";
import {info} from "./info";
import {lock} from "./lock";
import {reCalc} from "./reCalc";
import {remove} from "./remove";
import tokens from "../../../tokens";

const subCommandListTemp: SubCommand[] = [clear, info, lock, remove]
let SubCommandMap: Collection<string, SubCommand> = new Collection<string, SubCommand>();
for (let subCommand of subCommandListTemp) {
    SubCommandMap.set(subCommand.name, subCommand);
}

const SubCommandList = SubCommandMap;

export const _queue: Command = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('does the queue stuff')
        .addSubcommand(clear.data)
        .addSubcommand(info.data)
        .addSubcommand(lock.data)
        .addSubcommand(reCalc.data)
        .addSubcommand(remove.data),
    run: async (interaction, data) => {
        try {
            await SubCommandList.get(interaction.options.getSubcommand())!.run(interaction, data);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'queue',
    allowedRoles: tokens.Mods,
}
