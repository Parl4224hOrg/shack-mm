import {Modal} from "../interfaces/Modal";
import {Collection} from "discord.js";
import {pingMe} from "./pingMe";
import {register} from "./register";
import {reRegister} from "./reRegister";

// Create list of all modals
const modalList: Modal[] = [pingMe, register, reRegister];
// Initialize ModalMap
let ModalMap: Collection<string, Modal> = new Collection<string, Modal>();
// Map all modals to the map
for (let modal of modalList) {
    ModalMap.set(modal.id, modal);
}

export const ModalList = ModalMap;
