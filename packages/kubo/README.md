## A simple IPFS RPC Client

This built for Kubo node

## Installation

```sh
npm i @zkdb/kubo
```

## Usage

```ts
import { KuboClient } from "@zkdb/kubo";

(async () => {
  const client = new KuboClient();

  console.log(await client.filesLs());

  console.log(await client.filesRm({ arg: "/hello.txt" }));

  console.log(await client.filesStat({ arg: "/" }));

  console.log(
    await client.filesWrite(
      "/hello.txt",
      new TextEncoder().encode("Hello motherfukers! Robot here!")
    )
  );

  console.log(
    await client.filesMkdir({ arg: "/test/sub1/sub2", parents: true })
  );

  console.log(await client.existFile("/test"));
  console.log(await client.existDir("/test"));
  console.log(await client.exist("/test"));
  console.log(await client.existFile("/hello.txt"));
  console.log(await client.existDir("/hello.txt"));

  console.log(await client.filesRead({ arg: "/hello.txt" }));
  const result = await client.filesStat({ arg: "/" });

  console.log(await client.pinAdd({ arg: `/ipfs/${result.Hash}/test` }));

  console.log(
    await client.pinAdd({
      arg: `/ipfs/${result.Hash}/test/hello.txt`,
    })
  );

  console.log(await client.namePublish());

  console.log(
    await client.nameResolve(
      "k51qzi5uqu5did8im9w5dodv91gunxjqyvjlicyk2mrmsqes3n5m42pqp16t8e"
    )
  );

  console.log(await client.keyList());
})();
```

## License

This project is licensed under the [Apache-2.0](LICENSE).

**built with ❤️**
