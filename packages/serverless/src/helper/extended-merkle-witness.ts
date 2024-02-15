import { MerkleWitness, Field, Poseidon, Provable } from 'o1js';

/**
 * Factory function to create an ExtendedMerkleWitness class with a given height.
 * The ExtendedMerkleWitness class extends the BaseWitness class and provides an
 * additional method, `calculatePath`, to compute the Merkle path for a given leaf
 * in the tree.
 *
 * @param height The height of the Merkle tree.
 * @returns ExtendedMerkleWitness class with the specified height.
 */

export default function createExtendedMerkleWitness(height: number): any {
  const BaseWitness = MerkleWitness(height);

  class ExtendedMerkleWitness extends BaseWitness {
    calculatePath(leaf: Field): ExtendedMerkleWitness {
      const path = [];
      path.push({
        isLeft: this.isLeft[0],
        sibling: leaf,
      });

      for (let i = 1; i < this.height(); i += 1) {
        const isLeftChild = this.isLeft[i - 1];
        const siblingHash = this.path[i - 1];

        const left = Provable.if(
          isLeftChild,
          path[path.length - 1].sibling!,
          siblingHash
        );

        const right = Provable.if(
          isLeftChild,
          siblingHash,
          path[path.length - 1].sibling!
        );
        const hash = Poseidon.hash([left, right]);

        path.push({
          isLeft: isLeftChild,
          hash,
        });
      }

      return new ExtendedMerkleWitness(path as []);
    }

    merge(leaf: Field, other: ExtendedMerkleWitness): ExtendedMerkleWitness {
      const otherHeight = other.height();
      if (this.height() !== otherHeight) {
        throw Error('witnesses of different height are not mergable');
      }

      const index = Number(this.calculateIndex().toString());
      const otherIndex = Number(other.calculateIndex().toString());

      let levelWithDivergance: number = 0;
      let x = 2 ** (this.height() - 1) / 2;
      for (let i = 1; i < this.height(); i += 1) {
        const bothUpperHalf = index > x && otherIndex > x;
        const bothLowerHalf = index <= x && otherIndex <= x;

        if (bothUpperHalf) {
          x = x + x / 2;
        } else if (bothLowerHalf) {
          x /= 2;
        } else {
          levelWithDivergance = this.height() - i;
        }
      }

      let hash = leaf;
      for (let i = 0; i < levelWithDivergance; i += 1) {
        const left = Provable.if(other.isLeft[i], hash, other.path[i]);
        const right = Provable.if(other.isLeft[i], other.path[i], hash);
        hash = Poseidon.hash([left, right]);
      }

      const newWitness = this.isLeft.map((isLeft, i) => {
        return {
          isLeft: isLeft.toBoolean(),
          sibling: this.path[i],
        };
      });
      newWitness[levelWithDivergance].sibling = hash;

      return new ExtendedMerkleWitness(newWitness);
    }
  }

  return ExtendedMerkleWitness as any;
}
