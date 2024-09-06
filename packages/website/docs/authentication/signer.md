---
sidebar_position: 1
---

# Setting Up the Signer

To begin authentication, you need to initialize a signer. The signer is responsible for signing messages to authenticate the user, and it varies depending on whether the environment is a browser or a server.

**Example Code for Setting Up the Signer**
```ts
(async () => {
  let signer; // Declare the signer variable

  if (isBrowser) {
    // If running in a browser environment, use AuroWalletSigner
    signer = new AuroWalletSigner();
  } else {
    // If running in a Node.js environment, generate a private key
    const privateKey = PrivateKey.random();
    console.log(privateKey.toBase58()); // Log the private key for debugging (do not use in production)
    signer = new NodeSigner(privateKey); // Use NodeSigner with the generated private key
  }

  // Set the signer for zkdb
  zkdb.setSigner(signer);
})();
```