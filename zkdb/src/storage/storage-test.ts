import { IPFSStorage, IPFSStorageConfiguration } from "./ipfs-storage.js";

async function run() {
    const config: IPFSStorageConfiguration = { database: "TestDB" }

    const storage = await IPFSStorage.init(config);

    const obj = {
        employees: [
            { firstName: "John", lastName: "Doe" },
            { firstName: "Anna", lastName: "Smith" },
            { firstName: "Peter", lastName: "Jones" },
        ],
    };

    const result = await storage.put("Test", obj, { pin: true });
    console.log(result)

    // const getTestResult = await storage.get("Test", result.documentID)
    // console.log(getTestResult)
}


run()
