import QueueControllerModel from "../../database/models/QueueControllerModel";

export const getQueueController = async (queueId: string, queueName: string) => {
    return QueueControllerModel.findOne({queueId: queueId, queueName: queueName});
}