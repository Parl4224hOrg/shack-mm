import {ActionRowBuilder, MessageActionRowComponentBuilder} from "discord.js";
import {factory} from "../buttons/match/vote/factory";
import {hideout} from "../buttons/match/vote/hideout";
import {skyscraper} from "../buttons/match/vote/skyscraper";
import {enforcer} from "../buttons/match/vote/enforcer";
import {revolter} from "../buttons/match/vote/revolter";
import {ship} from "../buttons/match/vote/ship";

export const voteMap = (factoryCount: number, hideoutCount: number, skyscraperCount: number, shipCount: number) => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(factory.data.setLabel(`Factory: ${factoryCount}`),
            hideout.data.setLabel(`Hideout: ${hideoutCount}`),
            skyscraper.data.setLabel(`Skyscraper: ${skyscraperCount}`),
            ship.data.setLabel(`Ship: ${shipCount}`)).toJSON();
}

export const voteSide = (enforcerCount: number, revolterCount: number) => {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(enforcer.data.setLabel(`Enforcer: ${enforcerCount}`),
            revolter.data.setLabel(`Revolter: ${revolterCount}`),)
        .toJSON();
}