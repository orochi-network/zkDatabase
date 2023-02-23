import { IPFSStorage, IPFSStorageConfiguration } from "./ipfs-storage.js";

async function run() {
    const config: IPFSStorageConfiguration = { database: "TestDatabase" }

    const storage = await IPFSStorage.init(config);

    const obj = {
        employees: [
            { firstName: "John", lastName: "Doe" },
            { firstName: "Anna", lastName: "Smith" },
            { firstName: "Peter", lastName: "Jones" },
        ],
    };

    const result = await storage.put("TestFile", obj, { pin: true });
    console.log(result)

    const getTestResult = await storage.get("TestFile", result.documentID)
    console.log(getTestResult)
    console.log(getTestResult?.value)
}

run()
