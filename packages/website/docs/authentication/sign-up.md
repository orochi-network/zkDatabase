---
sidebar_position: 2
---

# Sign-Up: Register a New User

The `signUp` method is used to register a new user with zkDatabase. During sign-up, the user must provide a unique identifier (such as a username) and an email address. The signing method ensures that the user is authenticated securely.

#### Syntax
```ts
await zkdb.auth.signUp(username, email);
```

#### Parameters
- **`username`** (String): A unique identifier for the user.
- **`email`** (String): The user's email address.

#### Returns
- A promise that resolves when the user is successfully registered.

#### Example
```ts
await zkdb.auth.signUp('test-name', 'robot@gmail.com');
```

In this example, the signUp method registers a new user with the username `test-name` and email `robot@gmail.com`. The signer must be set up beforehand to authenticate the sign-up process.

