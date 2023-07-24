import {ActionRowBuilder, MessageActionRowComponentBuilder} from "discord.js";
import {readyAPAC15, readyAPAC30, readyAPAC60, readyAPAC120} from '../buttons/queue/SND/ReadyAPAC';
import {readyEU15, readyEU30, readyEU60, readyEU120} from "../buttons/queue/SND/ReadyEU";
import {readyFILL15, readyFILL30, readyFILL60, readyFILL120} from "../buttons/queue/SND/ReadyFILL";
import {readyNA15, readyNA30, readyNA60, readyNA120} from "../buttons/queue/SND/ReadyNA";

export const sndAPACReadyView = () => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(readyAPAC15.data, readyAPAC30.data, readyAPAC60.data, readyAPAC120.data).toJSON();
}

export const sndEUReadyView = () => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(readyEU15.data, readyEU30.data, readyEU60.data, readyEU120.data).toJSON();
}

export const sndFILLReadyView = () => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(readyFILL15.data, readyFILL30.data, readyFILL60.data, readyFILL120.data).toJSON();
}

export const sndNAReadyView = () => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(readyNA15.data, readyNA30.data, readyNA60.data, readyNA120.data).toJSON();
}