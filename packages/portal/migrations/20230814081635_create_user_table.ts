import { Knex } from 'knex';
import { addCreatedAndUpdated, addIdAndUuid } from '../src/helper/table';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('user', (table: Knex.CreateTableBuilder) => {
    addIdAndUuid(knex, table);

    table.string('name', 36).notNullable().unique().index();

    table.string('activeCode', 32).nullable().index();

    table.boolean('isActivated').notNullable().defaultTo(false);

    table.dateTime('banUntil').nullable().defaultTo(null);

    addCreatedAndUpdated(knex, table);

    table.index(['uuid', 'name'], 'indexed_fields');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('user');
}
