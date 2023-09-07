# Accumluation

## Accumulation scheme
An accumulation scheme is a scheme that allows the prover to combine several proofs into a single proof, which can be verified more efficiently compared to verifying each proof separately. This scheme is critical in scaling blockchain systems and other similar systems, which involve numerous transactions and hence, multiple proofs.

[Mina's Proof Systems](https://o1-labs.github.io/proof-systems/pickles/accumulation.html) - offers deep insights into the utilization and implementation of accumulation schemes.

## Block production

In the Mina blockchain, transactions are grouped into blocks and added to the blockchain in a sequential manner. The blocks are created by block producers (similar to miners in other blockchain networks), and the block producers are responsible for processing the transactions in the blocks they produce.

Now, when multiple transactions are sent to the same smart contract, and possibly calling the same function within a short time frame, they would be processed one after the other, in the order they are included in the block by the block producer. 

[Mina Block Production](https://docs.staketab.com/academy/mina/mina-block-production) - a comprehensive guide to understanding the nuances of block production within the Mina network.

### Handling Concurrent Calls to the Same Function

In the context of simultaneous calls to the same function in a smart contract:

- Atomicity: Each transaction is processed atomically. It will see a consistent state and produce a consistent state update.

- Isolation: Transactions are isolated from each other until they are included in the block, at which point the state changes become visible to subsequent transactions.

- Concurrency Issues: If two transactions are modifying the same piece of data, they will do so in the order determined by their position in the block, which prevents conflicts but can potentially lead to situations like __front-running__.


## Potential Approaches to Managing Accumulation

There are several options to process all accumulation data, one of them is to use a threshold.

```ts
@state root = State<Field>();
@state actionsHash = State<Field>();
@state userCount = State<Field>();
reducer = Reducer({ actionType: MerkleUpdate})

@method
deposit(user: PublicKey, amount: Field, witness: Witness) {
    this.userCount.set(this.userCount.get() + 1);
	this.root.assertEquals(this.root.get());
	this.root.assertEquals(witness.computeRoot(amount));
	user.send(this.account, amount);
	this.reducer.dispatch({ witness: witness, newLeaf: amount })

    if (this.userCount.get() >= TRANSACTION_THRESHOLD) {
        // if we reach a certain treshold, we process all accumulated data
        let root = this.root.get();
        let actionsHash = this.actionsHash.get();
        
        let { state: newRoot, actionsHash: newActionsHash } = this.reducer.reduce(
            this.reducer.getActions(actionsHash),
            MerkleUpdate,
            (state: Field, action: MerkleUpdate) => {
                return action.witness.computeRoot(action.newLeaf);
            }
        );
        
        this.root.set(newRoot);
        this.actionsHash.set(newActionsHash);
        this.userCount.set(0);
    }
}
```



## Potential Pitfalls
- **Front-running**: This refers to the potential for entities to manipulate transaction orders to their advantage, often at the expense of other users.

- **Re-entrance Attacks**: In such attacks, an adversary could potentially exploit vulnerabilities to initiate a function within a contract recursively, siphoning funds or causing other forms of damage.