/* eslint-disable no-unused-vars */

import { MerkleWitness } from "../../types/merkle-tree.js";
import { Ownable } from "./ownable.js";

export interface ZKDocument extends Ownable {
  getWitness(): Promise<MerkleWitness>
}