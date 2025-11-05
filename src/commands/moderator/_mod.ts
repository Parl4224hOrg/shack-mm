import { Command, SubCommand } from "../../interfaces/Command";
import { SlashCommandBuilder } from "@discordjs/builders";
import { Collection } from "discord.js";
import { logError } from "../../loggers";
import tokens from "../../tokens";
import { adjustMMR } from "./adjustMMR";
import { changeFailToAcceptCounter } from "./changeFailToAcceptCounter";
import { cooldown } from "./cooldown";
import { easyTime } from "./easyTime";
import { forceAbandon } from "./forceAbandon";
import { freeze } from "./freeze";
import { nullify } from "./nullify";
import { removeCooldown } from "./removeCooldown";
import { reverseCooldown } from "./reverseCooldown";
import { setMMR } from "../admin/Queue/setMMR";
import { setRegion } from "./setRegion";
import { transferUser } from "./transferUser";
import { warn } from "./warn";
import { warnings } from "./warnings";
import { warnRemove } from "./warnRemove";
import { onSubCommand } from "../../events/onSubCommand";
import { commandPermission } from "../../utility/commandPermission";
import { mute } from "./mute";
import { toggleReferee } from "./toggleReferee";
import { refMute } from "../ref/refMute";
import { changeAbandonCDCounter } from "./changeAbandonCDCounter";
import { manualSubmitIfAbandoned } from "./manualSubmitIfAbandoned";
import { manualSubmitIfNotAbandoned } from "./manualSubmitIfNotAbandoned";
import { freeAtNine } from "./freeAtNine";
import { adjustMatchScores } from "./adjustMatchScores";
import { refEasyTime } from "../ref/refEasyTime";
import { refForceAbandon } from "../ref/refForceAbandon";
import { refNullify } from "../ref/refNullify";
import { refWarn } from "../ref/refWarn";


const subCommandListTemp: SubCommand[] = [adjustMMR, changeAbandonCDCounter, changeFailToAcceptCounter, cooldown, easyTime,
    forceAbandon, freeze, nullify, manualSubmitIfAbandoned, manualSubmitIfNotAbandoned,
    removeCooldown, reverseCooldown, setMMR, setRegion, transferUser, warn, warnings, warnRemove, mute, toggleReferee,
    freeAtNine, adjustMatchScores, refEasyTime, refNullify, refWarn, refForceAbandon, refMute];
let SubCommandMap: Collection<string, SubCommand> = new Collection<string, SubCommand>();
for (let subCommand of subCommandListTemp) {
    SubCommandMap.set(subCommand.name, subCommand);
}

const SubCommandList = SubCommandMap;

export const _mod: Command = {
    data: new SlashCommandBuilder()
        .setName('mod')
        .setDescription('Mod commands')
        .addSubcommand(adjustMMR.data)
        .addSubcommand(changeAbandonCDCounter.data)
        .addSubcommand(changeFailToAcceptCounter.data)
        .addSubcommand(cooldown.data)
        .addSubcommand(easyTime.data)
        .addSubcommand(forceAbandon.data)
        .addSubcommand(freeze.data)
        .addSubcommand(nullify.data)
        .addSubcommand(removeCooldown.data)
        .addSubcommand(reverseCooldown.data)
        .addSubcommand(setMMR.data)
        .addSubcommand(setRegion.data)
        .addSubcommand(transferUser.data)
        .addSubcommand(warn.data)
        .addSubcommand(warnings.data)
        .addSubcommand(warnRemove.data)
        .addSubcommand(mute.data)
        .addSubcommand(manualSubmitIfAbandoned.data)
        .addSubcommand(manualSubmitIfNotAbandoned.data)
        .addSubcommand(toggleReferee.data)
        .addSubcommand(freeAtNine.data)
        .addSubcommand(adjustMatchScores.data)
        .addSubcommand(refEasyTime.data)
        .addSubcommand(refNullify.data)
        .addSubcommand(refWarn.data)
        .addSubcommand(refForceAbandon.data)
        .addSubcommand(refMute.data),
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
