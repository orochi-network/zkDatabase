import logger from '../helper/logger';

export default class SmartContractService {
  private address: string;
  
  private endpoint: string;

  constructor(endpoint: string, address: string) {
    this.address = address;
    this.endpoint = endpoint;
  }

  public async getActions(zkAppAddress: string): Promise<any> {
    const graphqlQuery = {
      query: `
        query getActions($zkAppAddress: String!) {
          zkapps(
            query: {
              zkappCommand: { accountUpdates: { body: { publicKey: $zkAppAddress } } }
              canonical: true
              failureReason_exists: false
            }
            sortBy: BLOCKHEIGHT_DESC
            limit: 1000
          ) {
            hash
            dateTime
            blockHeight
            zkappCommand {
              accountUpdates {
                body {
                  actions
                  publicKey
                }
              }
            }
          }
        }
      `,
      variables: {
        zkAppAddress,
      },
    };

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(graphqlQuery),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Error fetching data:', error);
      throw error;
    }
  }
}
