import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import tokens from "../../tokens";
import {logError} from "../../loggers";
import {TextChannel} from "discord.js";
import {sndAPACReadyView, sndEUReadyView, sndFILLReadyView, sndNAReadyView} from "../../views/staticViews";

export const prepare: Command = {
    data: new SlashCommandBuilder()
        .setName('prepare')
        .setDescription('prepares static views')
        .addStringOption(option => option
            .setName('view')
            .setDescription('view to prepare')
            .setRequired(true)
            .addChoices(
                {name: 'SND Ready', value: 'snd_ready'},
            )
        ),
    run: async (interaction) => {
        try {
            await interaction.deferReply({ephemeral: true});
            const view = interaction.options.getString('view')!
            switch (view) {
                case 'snd_ready': {
                    const channel = await interaction.guild!.channels.fetch(tokens.SNDReadyChannel) as TextChannel;
                    await channel.send({components: [sndFILLReadyView()], content: 'Ready up for any server'});
                    await channel.send({components: [sndAPACReadyView()], content: 'Ready up for APAC servers'});
                    await channel.send({components: [sndEUReadyView()], content: 'Ready up for EU servers'});
                    await channel.send({components: [sndNAReadyView()], content: 'Ready up for NA servers'});
                    await interaction.followUp({ephemeral: true, content: 'prepared snd ready up view'})
                } break;
                default: break;
            }
        } catch (e) {
            await logError(e, interaction)
        }
    },
    name: 'prepare',
    allowedUsers: [tokens.Parl],
}