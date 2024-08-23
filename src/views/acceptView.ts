import {ActionRowBuilder} from "discord.js";
import {accept} from "../buttons/match/accept";
import {MessageActionRowComponentBuilder} from "discord.js";
import {missing} from "../buttons/match/missing";
import {abandonConfirm} from "../buttons/match/abandon/abandonConfirm";
import {abandonDeny} from "../buttons/match/abandon/abandonDeny";
import {abandonButton} from "../buttons/match/abandon/abandonButton";

export const acceptView = () => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(accept.data, missing.data, abandonButton.data).toJSON();
}

export const confirmAbandonView = () => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(abandonConfirm.data, abandonDeny.data).toJSON();
}