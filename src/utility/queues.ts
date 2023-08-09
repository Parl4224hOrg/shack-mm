import {SlashCommandStringOption} from "discord.js";

export const queueOptions: SlashCommandStringOption = new SlashCommandStringOption()
    .setName('queue')
    .setDescription('The queue you wish to use')
    .setRequired(true)
    .setChoices(
        {name: 'SND', value: 'SND'},
        {name: 'ALL', value: 'ALL'}
        )

export const queueOptionsFull: SlashCommandStringOption = new SlashCommandStringOption()
        .setName('queue')
        .setDescription('The queue to ready for')
        .setRequired(true)
        .setChoices(
            {name: 'SND-FILL', value: 'SND-FILL'},
            {name: 'SND-NA', value: 'SND-NA'},
            {name: 'SND-EU', value: 'SND-EU'},
            {name: 'SND-APAC', value: 'SND-APAC'},
        )