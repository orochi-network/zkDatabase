export type TGroupInfo = {
  groupName: string;
  description: string;
  createdAt: number;
  createBy: string;
  members: Array<{ userName: string; createdAt: number }>;
};
