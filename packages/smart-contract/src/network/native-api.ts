import axios from 'axios';

export type TSendTransaction = {
  hash: string;
  id: string;
};

export async function sendTransaction(
  json: any,
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

  const variables = {
    input: json,
  };

  try {
    const response = await axios.post(
      url,
      {
        query,
        variables,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const { data, errors } = response.data;

    if (errors) {
      throw errors;
    }

    return data.sendZkapp.zkapp;
  } catch (error) {
    throw Error(error as any);
  }
}
