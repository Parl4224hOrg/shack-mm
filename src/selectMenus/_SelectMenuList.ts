import {StringSelectMenu} from "../interfaces/SelectMenu";
import {Collection} from "discord.js";
import {modSelectMenu} from "./modSelectMenu";


const selectMenuList: StringSelectMenu[] = [modSelectMenu]

let SelectMenuMap: Collection<string, StringSelectMenu> = new Collection<string, StringSelectMenu>();

for (let selectMenu of selectMenuList) {
    SelectMenuMap.set(selectMenu.id, selectMenu);
}

export const SelectMenuList = SelectMenuMap;
