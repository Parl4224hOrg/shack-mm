import {SubCommand} from "../../interfaces/Command";
import {SlashCommandSubcommandBuilder, StringSelectMenuOptionBuilder} from "discord.js";
import {logError} from "../../loggers";
import tokens from "../../tokens";
import {modSelectView} from "../../views/modSelectView";

export const byMod: SubCommand = {
    data: new SlashCommandSubcommandBuilder()
        .setName('by_mod')
        .setDescription('Displays actions taken a mod'),
    run: async (interaction) => {
        try {
            await interaction.deferReply({ephemeral:true})
            const guild = interaction.guild!;
            const modRole = await guild.roles.fetch(tokens.ModRole, {force: true});
            let mods: StringSelectMenuOptionBuilder[] = []
            for (let mod of modRole!.members.values()) {
                mods.push(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(`${mod.displayName}`)
                        .setDescription('A moderator')
                        .setValue(mod.id)
                );
            }
            await interaction.followUp({ephemeral: true, content: "Select a mod", components: [modSelectView(mods)]});
        } catch (e) {
            await logError(e, interaction)
        }
    },
    name: 'by_mod',
}