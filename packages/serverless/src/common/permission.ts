export type UserPermission = {
  insert: boolean;
  read: boolean;
  write: boolean;
  delete: boolean;
};

/**
 * Reducing array of permissions to single permission set
 * @param data Array of permissions
 * @returns
 */
export function reducePermssion(data: UserPermission[]) {
  return data.reduce((acc, cur) => {
    const entries = Object.entries(cur);
    for (let i = 0; i < entries.length; i += 1) {
      const [key, value] = entries[i];
      if (value === true) {
        (acc as any)[key] = true;
      }
    }
    return acc;
  });
}
