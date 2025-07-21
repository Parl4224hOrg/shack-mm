import {Command, SubCommand} from "../../interfaces/Command";
import {actions} from "../moderator/actions";
import {moderatorActions} from "../moderator/moderatorActions";
import {mapPlay} from "../moderator/mapPlay";
import {nextMapPool} from "../moderator/nextMapPool";
import {rankDist} from "../moderator/rankDist";
import {scoreDist} from "../moderator/scoreDist";
import {abandonRatio} from "../moderator/abandonRatio";
import {failToAcceptRatio} from "../moderator/failToAcceptRatio";
import {lateRatio} from "../moderator/lateRatio";
import {troubleMakers} from "../moderator/troubleMakers";
import {Collection} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import {onSubCommand} from "../../events/onSubCommand";
import {commandPermission} from "../../utility/commandPermission";
import {logError} from "../../loggers";
import tokens from "../../tokens";

const subCommandListTemp: SubCommand[] = [actions, moderatorActions, abandonRatio, mapPlay, nextMapPool, rankDist, scoreDist, failToAcceptRatio, lateRatio, troubleMakers];
let SubCommandMap: Collection<string, SubCommand> = new Collection<string, SubCommand>();
for (let subCommand of subCommandListTemp) {
    SubCommandMap.set(subCommand.name, subCommand);
}

const SubCommandList = SubCommandMap;

export const _modInfo: Command = {
    data: new SlashCommandBuilder()
        .setName('mod_info')
        .setDescription('Mod info commands')
        .addSubcommand(actions.data)
        .addSubcommand(moderatorActions.data)
        .addSubcommand(abandonRatio.data)
        .addSubcommand(mapPlay.data)
        .addSubcommand(nextMapPool.data)
        .addSubcommand(rankDist.data)
        .addSubcommand(scoreDist.data)
        .addSubcommand(failToAcceptRatio.data)
        .addSubcommand(lateRatio.data)
        .addSubcommand(troubleMakers.data)
    ,
    run: async (interaction, data) => {
        try {
            const command = SubCommandList.get(interaction.options.getSubcommand())!
            await onSubCommand(interaction, command, data, await commandPermission(interaction, command));
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'mod_info',
    allowedRoles: tokens.Mods,
}
