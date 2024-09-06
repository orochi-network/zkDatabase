---
sidebar_position: 3
---

# Sign-In: Authenticate an Existing User

The `signIn` method is used to authenticate an existing user in zkDatabase. The user must sign in using their email, and the signing process is validated using the previously provided signer.

#### Syntax
```ts
await zkdb.auth.signIn(email);
```

#### Parameters
- **`email`** (String): The email address of the user trying to sign in.

#### Returns
- A promise that resolves when the user is successfully authenticated.

#### Example
```ts
await zkdb.auth.signIn('robot@gmail.com');
```

In this example, the signIn method authenticates the user with the email `robot@gmail`.com. The signer set during initialization will be used to sign the authentication request.

