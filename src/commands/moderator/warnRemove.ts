import {SubCommand} from "../../interfaces/Command";
import {SlashCommandStringOption, SlashCommandSubcommandBuilder} from "discord.js";
import {logError} from "../../loggers";
import tokens from "../../tokens";
import WarnModel, {WarnInt} from "../../database/models/WarnModel";

const getWarnById = async (id: string): Promise<WarnInt | null> => {
    return WarnModel.findOne({_id: id}).exec();
}

export const warnRemove: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('remove_warn')
        .setDescription("Removes a warning from a user")
        .addStringOption(new SlashCommandStringOption()
            .setName("id")
            .setDescription("Id of the warning to remove")
            .setRequired(true)),
    run: async (interaction) => {
        try {
            const warn = await getWarnById(interaction.options.getString('id', true));
            if (warn) {
                warn.removed = true;
                await WarnModel.findByIdAndUpdate(warn._id, warn);
                await interaction.reply({content: "Warning has been removed"});
            } else {
                await interaction.reply({ephemeral: true, content: "Could not find warning to remove"})
            }
        } catch (e) {
            await logError(e, interaction);
        }
    },
    name: 'remove_warn',
    allowedRoles: tokens.Mods,
}