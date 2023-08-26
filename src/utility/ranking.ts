import tokens from "../tokens";
import {Rank} from "../interfaces/Internal";

export const getRank = (mmr: number): Rank => {
    let highRank: Rank = {name: 'unranked', threshold: -999999, roleId: ''};
    for (let rank of tokens.Ranks) {
        if (rank.threshold <= mmr && rank.threshold >= highRank.threshold) {
            highRank = rank;
        }
    }
    return highRank!;
}