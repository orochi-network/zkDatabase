import { exec } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync } from "node:fs";

const execPromise = promisify(exec);

async function execCommand(command) {
  const startTime = Date.now();
  const { stdout, stderr } = await execPromise(command);
  process.stdout.write(
    `Completed in ${Date.now() - startTime} ms: \x1b[32m${command}\x1b[0m`
  );
  if (stderr) {
    process.stdout.write(stdout);
    process.stderr.write(stderr);
  }
}

function readJsonFile(path) {
  const content = readFileSync(path, "utf-8");
  return JSON.parse(content);
}

const FILENAME_PERMISSION = "./packages/permission/package.json";
const FILENAME_COMMON = "./packages/common/package.json";
const FILENAME_API = "./packages/api/package.json";
const FILENAME_ZKDB = "./packages/zkdb/package.json";
const FILENAME_STORAGE = "./packages/storage/package.json";
const FILENAME_SMART_CONTRACT = "./packages/smart-contract/package.json";

const allFile = [
  FILENAME_PERMISSION,
  FILENAME_COMMON,
  FILENAME_API,
  FILENAME_ZKDB,
  FILENAME_STORAGE,
  FILENAME_SMART_CONTRACT,
];

const packageMap = new Map();

for (let i = 0; i < allFile.length; i += 1) {
  const jsonFile = readJsonFile(allFile[i]);
  packageMap.set(jsonFile.name, {
    name: jsonFile.name,
    version: jsonFile.version,
    dependencies: Object.entries(
      jsonFile.dependencies ? jsonFile.dependencies : {}
    ),
  });
}

async function main() {
  allFile.push("./packages/serverless/package.json");
  allFile.push("./packages/mina-service/package.json");
  for (let i = 0; i < allFile.length; i += 1) {
    const jsonFile = readJsonFile(allFile[i]);
    const dependencies = Object.entries(
      jsonFile.dependencies ? jsonFile.dependencies : {}
    );
    const listPackage = [];
    for (let j = 0; j < dependencies.length; j += 1) {
      const [name] = dependencies[j];
      if (packageMap.has(name)) {
        const newPackage = packageMap.get(name);
        listPackage.push(`${newPackage.name}@${newPackage.version}`);
      }
    }

    if (listPackage.length > 0) {
      const command = `yarn workspace ${jsonFile.name} add ${listPackage.join(" ")}\n`;
      process.stdout.write(`Execute: \x1b[33m${command}\x1b[0m`);
      // eslint-disable-next-line no-await-in-loop
      await execCommand(command);
    }
  }
}

main()
  .then(() => {
    process.stdout.write("Finished!\n");
  })
  .catch((e) => {
    process.stderr.write("Error:", e.message);
  });
