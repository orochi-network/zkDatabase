---
sidebar_position: 5
---

# Sign-Out: Log Out the User

The `signOut` method is used to log out the authenticated user from zkDatabase.

#### Syntax
```ts
await zkdb.auth.signOut();
```

#### Parameters
- None

#### Returns
- A promise that resolves when the user is successfully logged out.

#### Example
```ts
await zkdb.auth.signOut();
```

This example demonstrates how to log out the currently authenticated user from zkDatabase.

