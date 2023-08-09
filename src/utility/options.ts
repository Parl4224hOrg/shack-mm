import {SlashCommandStringOption, SlashCommandUserOption} from "discord.js";

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