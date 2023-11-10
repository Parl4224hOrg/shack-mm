import {Command, SubCommand} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Collection} from "discord.js";
import {logError} from "../../loggers";
import {byMod} from "./byMod";
import tokens from "../../tokens";

const subCommandListTemp: SubCommand[] = [byMod]
let SubCommandMap: Collection<string, SubCommand> = new Collection<string, SubCommand>();
for (let subCommand of subCommandListTemp) {
    SubCommandMap.set(subCommand.name, subCommand);
}

const SubCommandList = SubCommandMap;

export const _transparency: Command = {
    data: new SlashCommandBuilder()
        .setName('transparency')
        .setDescription('Transparency commands')
        .addSubcommand(byMod.data),
    run: async (interaction, data) => {
        try {
            await SubCommandList.get(interaction.options.getSubcommand())!.run(interaction, data);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'transparency',
    allowedRoles: [tokens.ModRole]
}