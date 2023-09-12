import { Knex } from 'knex';
import { addCreatedAndUpdated, addIdAndUuid } from '../src/helper/table';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(
    'api_key',
    (table: Knex.CreateTableBuilder) => {
      addIdAndUuid(knex, table);

      table
        .bigInteger('userId')
        .notNullable()
        .unsigned()
        .references('user.id')
        .comment('Foreign key to user.id')
        .index();

      table.string('name', 255).notNullable().index();

      table.string('key', 255).notNullable().index();

      table.index(['uuid', 'key', 'name'], 'indexed_fields');

      addCreatedAndUpdated(knex, table);
    }
  );
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('api_key');
}
