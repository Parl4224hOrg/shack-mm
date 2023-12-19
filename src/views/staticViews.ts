import {ActionRowBuilder, MessageActionRowComponentBuilder} from "discord.js";
import {readyAPAC15, readyAPAC30, readyAPAC60, readyAPAC120} from '../buttons/queue/SND/ReadyAPAC';
import {readyEU15, readyEU30, readyEU60, readyEU120} from "../buttons/queue/SND/ReadyEU";
import {readyFILL15, readyFILL30, readyFILL60, readyFILL120} from "../buttons/queue/SND/ReadyFILL";
import {readyNA15, readyNA30, readyNA60, readyNA120} from "../buttons/queue/SND/ReadyNA";
import {signup} from "../buttons/signup";
import {unready} from "../buttons/queue/SND/unready";
import {p2pToggle} from "../buttons/p2pToggle";
import {lfg} from "../buttons/queue/lfg";
import {stats} from "../buttons/queue/stats";
import {games} from "../buttons/queue/games";
import {APAC, EUE, EUW, NAE, NAW} from "../buttons/regionSelect";

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
        .addComponents(readyFILL15.data, readyFILL30.data, readyFILL60.data, readyFILL120.data, unready.data).toJSON();
}

export const SNDFILLReadyView2 = () => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(lfg.data, games.data, stats.data).toJSON();
}

export const sndNAReadyView = () => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(readyNA15.data, readyNA30.data, readyNA60.data, readyNA120.data).toJSON();
}

export const signUpView = () => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(signup.data, p2pToggle.data).toJSON();
}

export const regionSelectView = () => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(NAE.data, NAW.data, EUE.data, EUW.data, APAC.data).toJSON();
}

