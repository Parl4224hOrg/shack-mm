import {SubCommand} from "../../../interfaces/Command";
import {SlashCommandSubcommandBuilder} from "discord.js";
import {logError} from "../../../loggers";

export const lock: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('lock')
        .setDescription('locks or unlocks a queue')
        .addStringOption(option => option
            .setName('queue')
            .setDescription('The queue to lock or unlock')
            .setRequired(true)
            .setChoices({name: 'SND', value: 'SND'}, {name: 'ALL', value: 'ALL'})
        ),
    run: async (interaction, data) => {
        try {
            const queue = interaction.options.getString('queue', true);
            if (queue == 'ALL') {
                data.lockAllQueues();
                await interaction.reply({ephemeral: false, content: "Locked all queues"});
            } else {
                if (data.isLocked(queue)) {
                    data.unlockQueue(queue);
                    await interaction.reply({ephemeral: false, content: `Unlocked queue ${queue}`});
                } else {
                    data.lockQueue(queue);
                    await interaction.reply({ephemeral: false, content: `Locked queue ${queue}`});
                }
            }
        } catch (e) {
            await logError(e, interaction)
        }
    },
    name: 'lock'
}