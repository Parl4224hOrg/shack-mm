import UserModel, {UserInt} from "../../database/models/UserModel";

export const updateUser = async (user: UserInt) => {
    const filter = {_id: user._id};
    return UserModel.findOneAndUpdate(filter, user, {new: true, upsert: true});
}