import { Knex } from 'knex';
import { addCreatedAndUpdated, addIdAndUuid } from '../src/helper/table';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(
    'profile',
    (table: Knex.CreateTableBuilder) => {
      addIdAndUuid(knex, table);

      table
        .integer('userId')
        .notNullable()
        .unsigned()
        .references('user.id')
        .comment('Foreign key to user.id')
        .index();

      table.string('key', 255).notNullable();

      table.string('value', 512).notNullable();

      addCreatedAndUpdated(knex, table);
    }
  );
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('profile');
}
