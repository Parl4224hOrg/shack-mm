import {
    SlashCommandIntegerOption,
    SlashCommandNumberOption,
    SlashCommandStringOption,
    SlashCommandUserOption
} from "discord.js";

export const score = (name: string) => {
    return new SlashCommandIntegerOption()
        .setName(name)
        .setDescription('Score to submit')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(7)
}

export const reason: SlashCommandStringOption = new SlashCommandStringOption()
    .setName('reason')
    .setDescription('Reason the action was taken')
    .setRequired(true);

export const timeScales: SlashCommandStringOption = new SlashCommandStringOption()
    .setName('time_scale')
    .setDescription('The time scale to submit action on')
    .setRequired(true)
    .setChoices({name: 'Minutes', value: 'm'}, {name: 'Hours', value: 'h'}, {name: 'Days', value: 'd'}, {name: 'Weeks', value: 'w'});

export const timeOption: SlashCommandNumberOption = new SlashCommandNumberOption()
    .setName('time')
    .setDescription('Time for the action can be decimal')
    .setRequired(true);

export const queues: SlashCommandStringOption = new SlashCommandStringOption()
    .setName('queue')
    .setDescription('The queue to lock or unlock')
    .setRequired(true)
    .setChoices({name: 'SND', value: 'SND'}, {name: 'ALL', value: 'ALL'});


export const queuesSpecific: SlashCommandStringOption = new SlashCommandStringOption()
    .setName('queue')
    .setDescription('The queue to ready for')
    .setRequired(true)
    .setChoices(
        {name: 'SND-FILL', value: 'SND-FILL'},
        {name: 'SND-NA', value: 'SND-NA'},
        {name: 'SND-EU', value: 'SND-EU'},
        {name: 'SND-APAC', value: 'SND-APAC'},
    )

export const userOption = (description: string): SlashCommandUserOption => {
    return new SlashCommandUserOption()
        .setName('user')
        .setDescription(description)
        .setRequired(true);
}