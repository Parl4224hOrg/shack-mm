import {Command, SubCommand} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Collection} from "discord.js";
import {logError} from "../../loggers";
import tokens from "../../tokens";
import {actions} from "./actions";
import {adjustMMR} from "./adjustMMR";
import {cooldown} from "./cooldown";
import {easyTime} from "./easyTime";
import {findUser} from "./findUser";
import {forceAbandon} from "./forceAbandon";
import {forceScore} from "./forceScore";
import {freeze} from "./freeze";
import {mapPlay} from "./mapPlay";
import {nullify} from "./nullify";
import {rankDist} from "./rankDist";
import {removeCooldown} from "./removeCooldown";
import {reverseCooldown} from "./reverseCooldown";
import {scoreDist} from "./scoreDist";
import {setMMR} from "../admin/Queue/setMMR";
import {setRegion} from "./setRegion";
import {transferUser} from "./transferUser";
import {warn} from "./warn";
import {warnings} from "./warnings";
import {warnRemove} from "./warnRemove";
import {onSubCommand} from "../../events/onSubCommand";
import {commandPermission} from "../../utility/commandPermission";
import {mute} from "./mute";
import {toggleReferee} from "./toggleReferee";
import {lates} from "./lates";
import {lateRatio} from "./lateRatio";
import {nextMapPool} from "./nextMapPool";

const subCommandListTemp: SubCommand[] = [actions, adjustMMR, cooldown, easyTime, findUser, forceAbandon, forceScore, freeze, mapPlay, nullify,
    rankDist, removeCooldown, reverseCooldown, scoreDist, setMMR, setRegion, transferUser, warn, warnings, warnRemove, mute, toggleReferee, lates,
    lateRatio, nextMapPool];
let SubCommandMap: Collection<string, SubCommand> = new Collection<string, SubCommand>();
for (let subCommand of subCommandListTemp) {
    SubCommandMap.set(subCommand.name, subCommand);
}

const SubCommandList = SubCommandMap;

export const _mod: Command = {
    data: new SlashCommandBuilder()
        .setName('mod')
        .setDescription('Mod commands')
        .addSubcommand(actions.data)
        .addSubcommand(adjustMMR.data)
        .addSubcommand(cooldown.data)
        .addSubcommand(easyTime.data)
        .addSubcommand(findUser.data)
        .addSubcommand(forceAbandon.data)
        .addSubcommand(forceScore.data)
        .addSubcommand(freeze.data)
        .addSubcommand(mapPlay.data)
        .addSubcommand(nullify.data)
        .addSubcommand(rankDist.data)
        .addSubcommand(removeCooldown.data)
        .addSubcommand(reverseCooldown.data)
        .addSubcommand(scoreDist.data)
        .addSubcommand(setMMR.data)
        .addSubcommand(setRegion.data)
        .addSubcommand(transferUser.data)
        .addSubcommand(warn.data)
        .addSubcommand(warnings.data)
        .addSubcommand(warnRemove.data)
        .addSubcommand(mute.data)
        .addSubcommand(toggleReferee.data)
        .addSubcommand(lates.data)
        .addSubcommand(lateRatio.data)
        .addSubcommand(nextMapPool.data),
    run: async (interaction, data) => {
        try {
            const command = SubCommandList.get(interaction.options.getSubcommand())!
            await onSubCommand(interaction, command, data, await commandPermission(interaction, command));
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'mod',
    allowedRoles: tokens.Mods,
}
