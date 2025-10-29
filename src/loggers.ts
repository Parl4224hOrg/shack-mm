import { Client, Colors, EmbedBuilder, EmbedField, Interaction, TextChannel } from "discord.js";
import tokens from './tokens';


export async function logError(error: any, interaction: Interaction) {
    const guild = await interaction.client.guilds.fetch(tokens.MasterGuild);
    const channel = await guild.channels.fetch(tokens.LogChannel) as TextChannel;
    let embed = new EmbedBuilder();
    embed.setTitle('ERROR');
    embed.setColor(Colors.Red);
    let time = new Date().getTime();
    embed.setFooter({ text: `${time}` });
    let fields: EmbedField[] = [];

    // if (error.stack) {
    //     fields.push({
    //         name: 'error',
    //         value: `\`\`\`${error.stack}\`\`\``,
    //         inline: false
    //     });
    // }

    if (error.message) {
        fields.push({
            name: 'message',
            value: `\`\`\`${error.message}\`\`\``,
            inline: true
        });
    }

    if (error.type) {
        fields.push({
            name: 'type',
            value: `\`\`\`${error.type}\`\`\``,
            inline: true
        })
    }

    if (error.url) {
        fields.push({
            name: 'url',
            value: `\`\`\`${error.url}\`\`\``,
            inline: false
        });
    }

    if (interaction.isChatInputCommand()) {
        let optionInfo = ''
        for (let value of interaction.options.data.values()) {
            switch (value.type) {
                case 1: optionInfo += `Subcommand:\n${value.name}: ${value.value}\n\n`; break;
                case 3: optionInfo += `String Option:\n${value.name}: ${value.value}\n\n`; break;
                case 4: optionInfo += `Integer Option:\n${value.name}: ${value.value}\n\n`; break;
                case 5: optionInfo += `Boolean Option:\n${value.name}: ${value.value}\n\n`; break;
                case 6: optionInfo += `User Option:\n${value.name}: ${value.value}\n\n`; break;
                case 7: optionInfo += `Channel Option:\n${value.name}: ${value.value}\n\n`; break;
                case 8: optionInfo += `Role Option:\n${value.name}: ${value.value}\n\n`; break;
                case 9: optionInfo += `Mentionable Option:\n${value.name}: ${value.value}\n\n`; break;
                case 10: optionInfo += `Number Option:\n${value.name}: ${value.value}\n\n`; break;
                case 11: optionInfo += `Attachment Option:\n${value.name}: ${value.value}\n\n`; break;
            }
        }
        fields.push({
            name: "command",
            value: `\`\`\`${interaction.commandName}\`\`\``,
            inline: true,
        }, {
            name: "userId",
            value: `\`\`\`${interaction.user.id}\`\`\``,
            inline: true,
        });

        if (optionInfo != '') {
            fields.push({
                name: "Options",
                value: `\`\`\`${optionInfo}\`\`\``,
                inline: true,
            });
        }

    } else if (interaction.isButton()) {
        try {
            fields.push({
                name: "buttonId",
                value: `\`\`\`${interaction.customId}\`\`\``,
                inline: true,
            }, {
                name: "userId",
                value: `\`\`\`${interaction.user.id}\`\`\``,
                inline: true,
            },);
        } catch (e) {
            await logWarn("warn", interaction.client);
        }
    }
    embed.setFields(fields);
    await channel!.send({ embeds: [embed] });
}

export async function logInfo(message: string, client: Client, pings?: string[]) {
    const guild = await client.guilds.fetch(tokens.MasterGuild);
    const channel = await guild.channels.fetch(tokens.LogChannel) as TextChannel;
    let embed = new EmbedBuilder();
    embed.setTitle('INFO');
    embed.setColor(Colors.Green);
    let time = new Date().getTime();
    embed.setFooter({ text: `${time}` });
    embed.setFields([{
        name: 'message',
        value: message,
        inline: false
    }]);
    let ping = "";
    if (pings) {
        pings = pings.map(ping => `<@${ping}>`);
        ping = pings.join(" ");
    }
    await channel.send({ content: ping, embeds: [embed] });
}

export async function logWarn(warning: string, client: Client) {
    const guild = await client.guilds.fetch(tokens.MasterGuild);
    const channel = await guild.channels.fetch(tokens.LogChannel) as TextChannel;
    let embed = new EmbedBuilder();
    embed.setTitle('WARN');
    embed.setColor(Colors.Yellow);
    let time = new Date().getTime();
    embed.setFooter({ text: `${time}` });
    embed.setFields([{
        name: 'message',
        value: warning,
        inline: false
    }]);
    await channel.send({ embeds: [embed] });
}

export async function logModInfo(logMessage: string, client: Client, action?: string, pings?: string[]) {
    const channel = await client.channels.fetch(tokens.ModeratorLogChannel) as TextChannel;
    let embed = new EmbedBuilder();
    if (action) {
        embed.setTitle(`MOD ACTION: ${action}`);
    } else {
        embed.setTitle('MOD ACTION');
    }
    embed.setColor(Colors.Green);
    let time = new Date().getTime();
    embed.setFooter({ text: `${time}` });
    embed.setFields([{
        name: 'message',
        value: logMessage,
        inline: false
    }]);
    let ping = "";
    if (pings) {
        pings = pings.map(ping => `<@${ping}>`);
        ping = pings.join(" ");
    }
    await channel.send({ content: ping, embeds: [embed] });
}