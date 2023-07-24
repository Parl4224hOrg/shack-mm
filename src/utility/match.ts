import {getUserByUser} from "../modules/getters/getUser";
import {ButtonInteraction, ChatInputCommandInteraction} from "discord.js";
import {Data} from "../data";

export const matchVotes = async (interaction: ButtonInteraction, data: Data) => {
    const dbUser = await getUserByUser(interaction.user);
    const controller = data.findController(dbUser._id);
    if (controller) {
        const game = controller.findGame(dbUser._id);
        if (game) {
            const response = await game.vote(dbUser._id, interaction.customId);
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

export const matchScore = async (interaction: ButtonInteraction, data: Data, score: number)=> {
    const dbUser = await getUserByUser(interaction.user);
    const controller = data.findController(dbUser._id);
    if (controller) {
        const game = controller.findGame(dbUser._id);
        if (game) {
            const response = await game.submitScore(dbUser._id, score);
            await interaction.reply({ephemeral: false, content: response.message});
        } else {
            await interaction.reply({ephemeral: true, content: "Could not find game please contact a mod"});
        }
    } else {
        await interaction.reply({ephemeral: true, content: "Could not find controller please contact a mod"});
    }
}
