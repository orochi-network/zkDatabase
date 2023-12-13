import { Readable } from "stream";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { KuboClient } from "../src/index.js";

describe("KuboClient", () => {
  let kuboClient: KuboClient;
  let mock: MockAdapter;

  beforeAll(() => {
    kuboClient = new KuboClient();

    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.reset();
  });

  it("should handle read stream", async () => {
    const fakeStream = new Readable();
    fakeStream.push("real data");
    fakeStream.push(null);

    const command = "files/readStream"
    const url = `${kuboClient.config.protocol}://${kuboClient.config.host}:${kuboClient.config.port}${kuboClient.config.apiPath}/${command}`
    mock.onGet(url).reply(200, fakeStream);

    const result = await kuboClient.filesReadStream(command);
    let data = "";
    result.on("data", (chunk) => {
      data += chunk;
    });

    return new Promise<void>((resolve) => {
      result.on("end", () => {
        expect(data).toEqual("real data");
        resolve();
      });
    });
  });

  it('should handle write stream', async () => {
    const fakeStreamContent = 'real data';
    const fakeStream = new Readable();
    fakeStream.push(fakeStreamContent);
    fakeStream.push(null);

    const command = "files/writeStream"
    const url = `${kuboClient.config.protocol}://${kuboClient.config.host}:${kuboClient.config.port}${kuboClient.config.apiPath}/${command}`

    mock.onPost(url).reply(200, { status: 'success' });

    const result = await kuboClient.filesWriteStream(command, fakeStream);
    expect(mock.history.post).toHaveLength(1);
    expect(mock.history.post[0].url).toBe(url);

    const requestData = await streamToString(mock.history.post[0].data);
    expect(requestData).toBe(fakeStreamContent)

    expect(mock.history.post[0].headers!['Content-Type']).toBe('application/octet-stream');

    expect(result).toEqual({ status: 'success' });
  });

  function streamToString(stream: Readable): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: any[] = [];
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
  }
});
