import ActionModel, {Actions} from "../../database/models/ActionModel";
import moment from "moment";

export const createActionUser = async (action: Actions,modId: string, userId: string, reason: string, actionData: string) => {
    return await ActionModel.create({
        action: action,
        modId: modId,
        userId: userId,
        reason: reason,
        time: moment().unix(),
        actionData: actionData,
    })
}

export const createAction = async (action: Actions,modId: string, reason: string, actionData: string) => {
    return await ActionModel.create({
        action: action,
        modId: modId,
        userId: modId,
        reason: reason,
        time: moment().unix(),
        actionData: actionData,
    })
}
