export type TGroupInfoDetail = {
  groupName: string;
  description: string;
  createdAt: number;
  createBy: string;
  members: Array<{ userName: string; createdAt: number }>;
};

export type TGroupInfo = {
  groupName: string;
  description: string;
  createdAt: number;
  createBy: string;
};
