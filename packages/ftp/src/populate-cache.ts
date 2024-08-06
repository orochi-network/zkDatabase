import { promises as fs } from "fs";
import { join } from "path";
import { buildCircuitCache } from "@zkdb/smart-contract";

const ftpRoot = join(process.cwd(), "ftp-root");

const createUserDatabaseCache = async (basePath: string) => {
  await buildCircuitCache(18, basePath);
};

const populateFTP = async () => {
  await fs.mkdir(ftpRoot, { recursive: true });
  await createUserDatabaseCache(ftpRoot);
  console.log("FTP server populated with files and directories.");
};

populateFTP().catch((err) => {
  console.error("Error populating FTP server:", err);
});
