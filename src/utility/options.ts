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
        .setMaxValue(10)
}

export const games = () => {
    return new SlashCommandIntegerOption()
        .setName('games')
        .setDescription("Number of games to graph defaults to 10 with a min of 10")
        .setRequired(false)
        .setMinValue(10)
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

export const mmrOption: SlashCommandNumberOption = new SlashCommandNumberOption()
    .setName('mmr')
    .setDescription('The MMR to adjust to')
    .setRequired(true);

export const queues: SlashCommandStringOption = new SlashCommandStringOption()
    .setName('queue')
    .setDescription('The queue to lock or unlock')
    .setRequired(true)
    .setChoices({name: 'SND', value: 'SND'}, {name: 'ALL', value: 'ALL'});

export const userOption = (description: string): SlashCommandUserOption => {
    return new SlashCommandUserOption()
        .setName('user')
        .setDescription(description)
        .setRequired(true);
}

export const timeOption: SlashCommandNumberOption = new SlashCommandNumberOption()
    .setName('time')
    .setDescription("Time can be a decimal value")
    .setRequired(true)

export const cdType: SlashCommandStringOption = new SlashCommandStringOption()
    .setName('type')
    .setDescription("The type of cd to remove or reverse")
    .setRequired(true)
    .setChoices(
        {
            name: "Abandon",
            value: "abandon",
        },{
            name: "Fail to Accept",
            value: "fail",
        }
    )

export const userOptional = (description: string): SlashCommandUserOption => {
    return new SlashCommandUserOption()
        .setName('user')
        .setDescription(description)
        .setRequired(false);
}