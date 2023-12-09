import {Command, SubCommand} from "../../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {logError} from "../../../loggers";
import {Collection} from "discord.js";
import {commandPermission} from "../../../utility/commandPermission";
import {onSubCommand} from "../../../events/onSubCommand";
import tokens from "../../../tokens";
import {fiveVFive} from "./fiveVFive";

// Create list of all commands that are subcommands of caster
const subCommandList: SubCommand[] = [fiveVFive];
// Initialize SubCommandMap
let SubCommandMap: Collection<string, SubCommand> = new Collection<string, SubCommand>();
// Map subCommandList to SubCommandMap
for (let subCommand of subCommandList) {
    SubCommandMap.set(subCommand.name, subCommand);
}

const SubCommandList = SubCommandMap;

export const _ready: Command = {
    data: new SlashCommandBuilder()
        .setName('ready')
        .setDescription('Readies you for a game in a queue')
        .addSubcommand(fiveVFive.data),
    run: async (interaction, data) => {
        try {
            // Get command from the mapped commands
            const command = SubCommandList.get(interaction.options.getSubcommand())!
            // Check to see if user has permission to use command
            const permission = await commandPermission(interaction, command);
            // Call onSubCommand which checks returned permissions and will run command if valid
            await onSubCommand(interaction, command, data, permission);
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'ready',
    allowedRoles: [tokens.Player],
}