import {QueueController} from "../../controllers/QueueController";
import QueueControllerModel from "../../database/models/QueueControllerModel";

export const updateQueueController = async (queue: QueueController) => {
    const gameIds = []
    for (let game of queue.activeGames) {
        gameIds.push(game.id);
    }
    return QueueControllerModel.findOneAndUpdate({queueId: queue.queueId, queueName: queue.queueName}, {
        queueId: queue.queueId,
        queueName: queue.queueName,
        inQueue: queue.getInQueue(),
        activeGames: gameIds,
    }, {upsert: true});
}