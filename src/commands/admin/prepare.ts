import {Command} from "../../interfaces/Command";
import {ButtonBuilder, SlashCommandBuilder} from "@discordjs/builders";
import tokens from "../../tokens";
import {logError} from "../../loggers";
import {TextChannel, MessageFlagsBitField, ActionRowBuilder} from "discord.js";
import {
    MapTestSignupView,
    regionSelectView,
    signUpView,
    sndFILLReadyView,
    SNDFILLReadyView2,
    SNDFILLReadyView3
} from "../../views/staticViews";
import {updateInfo} from "../../buttons/update-info";

export const prepare: Command = {
    data: new SlashCommandBuilder()
        .setName('prepare')
        .setDescription('prepares static views')
        .addStringOption(option => option
            .setName('view')
            .setDescription('view to prepare')
            .setRequired(true)
            .addChoices(
                {name: 'SND Ready', value: 'snd_ready'},
                {name: "Sign Up", value: "signup"},
                {name: "Info", value: "info"},
                {name: "cleanup", value: "c"},
                {name: 'Clear', value: 'c2'},
                {name: "Region", value: 'region'},
                {name: "Map Test", value: "map"},
            )
        ),
    run: async (interaction) => {
        try {
            await interaction.deferReply({flags: MessageFlagsBitField.Flags.Ephemeral});
            const view = interaction.options.getString('view')!
            if (interaction.channel!.isSendable()) {
                switch (view) {
                    case 'snd_ready': {
                        await interaction.channel!.send({
                            components: [sndFILLReadyView(), SNDFILLReadyView2(), SNDFILLReadyView3()],
                            content: 'Ready up for SND'
                        });
                        await interaction.followUp({flags: MessageFlagsBitField.Flags.Ephemeral, content: 'prepared snd _ready up view'})
                    }
                        break;
                    case 'signup': {
                        await interaction.channel!.send({components: [signUpView()], content: tokens.SignUpMessage})
                        await interaction.followUp({flags: MessageFlagsBitField.Flags.Ephemeral, content: 'prepared sign up view'})
                    }
                        break;
                    case 'info': {
                        await interaction.channel!.send({
                            content: "Press This Button to Update #mm-info",
                            components: [new ActionRowBuilder<ButtonBuilder>().addComponents(updateInfo.data)]
                        })
                        await interaction.followUp({flags: MessageFlagsBitField.Flags.Ephemeral, content: 'prepared info updater'})
                    }
                        break;
                    case 'c': {
                        const roles = await interaction.guild!.roles.fetch();
                        for (let role of roles.values()) {
                            if (role.name.includes('team') || role.name.includes('match')) {
                                await role.delete();
                            }
                        }
                        await interaction.followUp({flags: MessageFlagsBitField.Flags.Ephemeral, content: "done"});
                    }
                        break;
                    case 'c2': {
                        const channel = interaction.channel as TextChannel;
                        await channel.bulkDelete(100, true);
                        await interaction.followUp({flags: MessageFlagsBitField.Flags.Ephemeral, content: "done"})
                    }
                        break;
                    case 'region': {
                        await interaction.channel!.send({
                            components: [regionSelectView()],
                            content: tokens.RegionSelectMessage
                        });
                        await interaction.followUp({flags: MessageFlagsBitField.Flags.Ephemeral, content: 'prepared region select view'})
                    }
                        break;
                    case 'map': {
                        await interaction.channel!.send({
                            components: [MapTestSignupView()],
                            content: "Use this button to toggle whether or not to be notified about map tests"
                        });
                        await interaction.followUp({flags: MessageFlagsBitField.Flags.Ephemeral, content: 'prepared map testing view'});
                    }
                        break;
                    default:
                        break;
                }
            } else {
                await interaction.followUp({flags: MessageFlagsBitField.Flags.Ephemeral, content: 'cannot send message'});
            }
        } catch (e) {
            await logError(e, interaction)
        }
    },
    name: 'prepare',
    allowedRoles: [tokens.AdminRole],
}
