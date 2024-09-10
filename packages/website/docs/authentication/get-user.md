---
sidebar_position: 4
---

# Get User Information

The `getUser` method retrieves information about the currently logged-in user. If no user is logged in, it returns `null`.

#### Syntax
```ts
const user = await zkdb.auth.getUser();
```

#### Returns
- An object of type `ZKDatabaseUser` containing the user's information, or `null` if no user is logged in.

#### ZKDatabaseUser Type Definition
```ts
export type ZKDatabaseUser = {
  name: string,
  email: string,
  publicKey: string
};
```

#### Example
```ts
const user = await zkdb.auth.getUser();
if (user) {
  console.log('Logged in user:', user.name, user.email, user.publicKey);
} else {
  console.log('No user is currently logged in.');
}
```

In this example, the `getUser` method checks if there is a logged-in user and retrieves their information if available.