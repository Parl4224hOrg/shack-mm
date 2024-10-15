import {EmbedBuilder} from "discord.js";

export const MapTestEmbed = (owner: string, players: string[], time: number, map: string, description: string, id: string) => {
    const embed = new EmbedBuilder()
    embed.setTitle(`Map Test: ${map}`);
    let desc = `The test is at <t:${time}:F> <t:${time}:R>\nMade by <@${owner}>\n` + description;
    embed.setDescription(desc);
    let playersText = "Listed in order of signup:\n";
    for (let player of players) {
        playersText += `<@${player}>\n`;
    }

    embed.setFields({
        name: `Signed Up ${players.length}/10`,
        value: playersText
    });
    embed.setFooter({text: id});
    return embed.toJSON();
}