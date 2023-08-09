import {Command} from "../../interfaces/Command";
import {SlashCommandBuilder} from "@discordjs/builders";
import {userOption} from "../../utility/options";

export const cooldown: Command = {
    data: new SlashCommandBuilder()
        .setName('cooldown')
        .setDescription('Gives a player a cooldown preventing them from playing')
        .addUserOption(userOption('User to give cooldown to'))
}