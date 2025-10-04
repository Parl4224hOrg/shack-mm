import {ActionRowBuilder, MessageActionRowComponentBuilder} from "discord.js";
import {readyFILL15, readyFILL30, readyFILL60, readyFILL120} from "../buttons/queue/SND/ReadyFILL";
import {signup} from "../buttons/signup";
import {unready} from "../buttons/queue/SND/unready";
import {p2pToggle} from "../buttons/p2pToggle";
import {lfg} from "../buttons/queue/lfg";
import {stats} from "../buttons/queue/stats";
import {games} from "../buttons/queue/games";
import {APAC, EUE, EUW, NAE, NAW} from "../buttons/regionSelect";
import {pingMeButton} from "../buttons/queue/pingMe";
import {checkBanButton} from "../buttons/queue/checkBan";
import {graphButton} from "../buttons/queue/graph";
import { ratingChangeButton } from "../buttons/queue/ratingChange";
import {mapTesterToggle} from "../buttons/mapTesterToggle";
import {mapTestSignup} from "../buttons/mapTestSignup";
import {mapTestRemoveSignup} from "../buttons/mapTestRemoveSignup";
import {register} from "../buttons/register";
import {lateRatioButton} from "../buttons/queue/lateRatio";



export const sndFILLReadyView = () => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(readyFILL15.data, readyFILL30.data, readyFILL60.data, readyFILL120.data, unready.data).toJSON();
}

export const SNDFILLReadyView2 = () => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(pingMeButton.data, lfg.data, games.data, checkBanButton.data, lateRatioButton.data).toJSON();
}

export const SNDFILLReadyView3 = () => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(stats.data, ratingChangeButton.data, graphButton.data).toJSON();
}

export const signUpView = () => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(signup.data, p2pToggle.data, register.data).toJSON();
}

export const regionSelectView = () => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(NAE.data, NAW.data, EUE.data, EUW.data, APAC.data).toJSON();
}

export const MapTestView = () => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(mapTestSignup.data, mapTestRemoveSignup.data).toJSON();
}

export const MapTestSignupView = () => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(mapTesterToggle.data).toJSON();
}

