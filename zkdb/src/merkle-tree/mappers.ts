import { Field } from 'snarkyjs';
import { MerkleNodesMap } from './merkle-tree-base.js';

export const mapFieldToString = (nodesMap: MerkleNodesMap) => {
  let result: { [level: number]: { [node: string]: string } } = {};
  for (const level in nodesMap) {
    result[level] = {};
    const levelNodes = nodesMap[level];
    for (const nodeIndex in levelNodes) {
      const field = levelNodes[nodeIndex];
      result[level][nodeIndex] = field.toString();
    }
  }
  return result;
};

export const mapStringToField = (nodesMap: MerkleNodesMap) => {
  for (const level in nodesMap) {
    const levelNodes = nodesMap[level];
    for (const nodeIndex in levelNodes) {
      const nodeValue = levelNodes[nodeIndex];
      delete levelNodes[nodeIndex];
      levelNodes[nodeIndex] = Field(nodeValue);
    }
  }
  return nodesMap;
};
