// eslint-disable-next-line import/prefer-default-export
export const typeCommonDefsTransaction = `#graphql

enum TransactionStatus {
  start
  ready
  pending
  failed
  success
  unknown
}

enum TransactionType {
  deploy
  rollup
}

type DbTransaction {
  databaseName: String!
  transactionType: TransactionType!
  zkAppPublicKey: String!
  status: TransactionStatus!
  tx: String!
  id: String!
}

`;
