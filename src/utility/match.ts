import {getUserByUser} from "../modules/getters/getUser";
import {ButtonInteraction, ChatInputCommandInteraction} from "discord.js";
import {Data} from "../data";

export const matchVotes = async (interaction: ButtonInteraction, data: Data) => {
    const dbUser = await getUserByUser(interaction.user);
    const controller = data.findController();
    if (controller) {
        const game = controller.findGame(dbUser._id);
        if (game) {
            const response = await game.vote(dbUser._id, interaction.customId as any);
            await interaction.reply({ephemeral: true, content: response.message});
        } else {
            await interaction.reply({ephemeral: true, content: "Could not find game please contact a mod"});
        }
    } else {
        await interaction.reply({ephemeral: true, content: "Could not find controller please contact a mod"});
    }
}

export const matchReady = async (interaction: ButtonInteraction | ChatInputCommandInteraction, data: Data, queueId: string, queue: string, time: number)=> {
    const response = await data.ready(queueId, queue, interaction.user, time);
    await interaction.reply({ephemeral: true, content: response.message});
}

export const matchUnready = async (interaction: ButtonInteraction | ChatInputCommandInteraction, data: Data, queueId: string) => {
    const dbUser = await getUserByUser(interaction.user);
    data.removeFromQueue(dbUser._id, queueId);
    await interaction.reply({ephemeral: true, content: `You have unreadied from ${queueId} queues`})
}

export const matchScore = async (interaction: ButtonInteraction, data: Data, score: number)=> {
    const dbUser = await getUserByUser(interaction.user);
    const controller = data.findController();
    if (controller) {
        const game = controller.findGame(dbUser._id);
        if (game) {
            const response = await game.submitScore(dbUser._id, score, interaction.user.id);
            await interaction.reply({ephemeral: false, content: response.message});
        } else {
            await interaction.reply({ephemeral: true, content: "Could not find game please contact a mod"});
        }
    } else {
        await interaction.reply({ephemeral: true, content: "Could not find controller please contact a mod"});
    }
}
