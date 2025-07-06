import {SubCommand} from "../../../interfaces/Command";
import {SlashCommandSubcommandBuilder} from "discord.js";
import {logError} from "../../../loggers";
import {queues} from "../../../utility/options";

export const lock: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('lock')
        .setDescription('locks or unlocks a queue')
        .addStringOption(queues),
    run: async (interaction, data) => {
        try {
            const queue = interaction.options.getString('queue', true);
            if (queue == 'ALL') {
                data.lockAllQueues();
                await interaction.reply({content: "Locked all queues"});
            } else {
                if (data.isLocked(queue)) {
                    data.unlockQueue(queue);
                    await interaction.reply({content: `Unlocked queue ${queue}`});
                } else {
                    data.lockQueue(queue);
                    await interaction.reply({content: `Locked queue ${queue}`});
                }
            }
        } catch (e) {
            await logError(e, interaction)
        }
    },
    name: 'lock'
}