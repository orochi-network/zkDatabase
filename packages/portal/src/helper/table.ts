import { Knex } from 'knex';

export function addIdAndUuid(_knex: Knex, table: Knex.CreateTableBuilder) {
  table.bigIncrements('id').unsigned().primary();
  table
    .string('uuid', 40)
    .notNullable()
    .index()
    .comment('External uuid of this record');
}

export function addCreatedAndUpdated(
  knex: Knex,
  table: Knex.CreateTableBuilder
) {
  table
    .timestamp('createdDate')
    .notNullable()
    .defaultTo(knex.raw('CURRENT_TIMESTAMP'))
    .index()
    .comment('Created date');
  table
    .timestamp('updatedDate')
    .notNullable()
    .defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
    .index()
    .comment('Last updated date');
}

export default {
  addCreatedAndUpdated,
  addIdAndUuid,
};
