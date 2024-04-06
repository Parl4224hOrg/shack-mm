import UserModel, {UserInt} from "../../database/models/UserModel";
import {Data} from "../../data";

export const updateUser = async (user: UserInt, data?: Data): Promise<UserInt> => {
    const filter = {_id: user._id};
    const newUser = await UserModel.findOneAndUpdate(filter, user, {upsert: true, returnDocument: 'after'});
    if (data) {
        data.cacheUser(newUser)
    }
    return newUser
}