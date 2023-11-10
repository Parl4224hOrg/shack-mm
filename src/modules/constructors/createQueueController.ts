import {QueueController} from "../../controllers/QueueController";
import QueueControllerModel from "../../database/models/QueueControllerModel";

export const createQueueController = async (queue: QueueController) => {
    const gameIds = []
    for (let game of queue.activeGames) {
        gameIds.push(game.id);
    }
    return await QueueControllerModel.create({
        queueId: queue.queueId,
        queueName: queue.queueName,
        inQueue: queue.getInQueue(),
        activeGames: gameIds,
    })
}