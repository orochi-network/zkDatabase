import axios from 'axios';

type TSendTransaction = {
  hash: string;
  id: string;
  zkappCommand: {
    memo: string;
  };
};

export async function sendTransaction(
  json: unknown,
  url: string
): Promise<TSendTransaction> {
  const query = `
    mutation sendZkapp($input: SendZkappInput!) {
      sendZkapp(input: $input) {
        zkapp {
          hash
          id
          zkappCommand {
            memo
          }
        }
      }
    }
  `;

  const variables = { input: json };

  const response = await axios.post(
    url,
    { query, variables },
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const { data, errors } = response.data;

  if (errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(errors)}`);
  }

  if (!data?.sendZkapp?.zkapp) {
    throw new Error('Error: zkapp data is missing.');
  }

  return data.sendZkapp.zkapp;
}
