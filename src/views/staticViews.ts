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

export const sndFILLReadyView = () => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(readyFILL15.data, readyFILL30.data, readyFILL60.data, readyFILL120.data, unready.data).toJSON();
}

export const SNDFILLReadyView2 = () => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(lfg.data, games.data, stats.data, pingMeButton.data, checkBanButton.data).toJSON();
}


export const signUpView = () => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(signup.data, p2pToggle.data).toJSON();
}

export const regionSelectView = () => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(NAE.data, NAW.data, EUE.data, EUW.data, APAC.data).toJSON();
}

