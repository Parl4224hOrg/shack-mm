import GameModel, {GameInt} from "../../database/models/GameModel";

export const updateGame = async (game: GameInt) => {
    const filter = {_id: game._id};
    return GameModel.findOneAndUpdate(filter, game, {new: true, upsert: true});
}