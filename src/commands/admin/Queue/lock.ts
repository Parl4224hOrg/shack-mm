import {SubCommand} from "../../../interfaces/Command";
import {SlashCommandSubcommandBuilder} from "discord.js";
import {logError} from "../../../loggers";

export const lock: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('lock')
        .setDescription('locks or unlocks queue'),
    run: async (interaction, data) => {
        try {
            if (data.isLocked()) {
                data.unlockQueue();
                await interaction.reply({content: `Unlocked queue`});
            } else {
                data.lockQueue();
                await interaction.reply({content: `Locked queue`});
            }
        } catch (e) {
            await logError(e, interaction)
        }
    },
    name: 'lock'
}