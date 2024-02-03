import {StringSelectMenu} from "../interfaces/SelectMenu";
import {Collection} from "discord.js";


const selectMenuList: StringSelectMenu[] = []

let SelectMenuMap: Collection<string, StringSelectMenu> = new Collection<string, StringSelectMenu>();

for (let selectMenu of selectMenuList) {
    SelectMenuMap.set(selectMenu.id, selectMenu);
}

export const SelectMenuList = SelectMenuMap;
