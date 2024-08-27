/* eslint-disable no-unused-vars */

import { MerkleWitness } from "../../types/merkle-tree.js";
import { DocumentEncoded } from "../schema.js";
import { Ownable } from "./ownable.js";

export interface ZKDocument extends Ownable {
  getId(): string
  getDocumentEncoded(): DocumentEncoded;
  getWitness(): Promise<MerkleWitness>
  delete(): Promise<MerkleWitness>
  getCreatedAt(): Date
}