import { Knex } from 'knex';
import { addCreatedAndUpdated, addIdAndUuid } from '../src/helper/table';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(
    'login_method',
    (table: Knex.CreateTableBuilder) => {
      addIdAndUuid(knex, table);

      table
        .bigInteger('userId')
        .notNullable()
        .unsigned()
        .references('user.id')
        .comment('Foreign key to user.id')
        .index();

      table.string('type', 10).notNullable().index().comment('Login type');

      table.string('externalId', 255).nullable().unique().index();

      table.string('email', 255).notNullable().index();

      table.string('password', 512).nullable();

      addCreatedAndUpdated(knex, table);

      table.index(['uuid', 'externalId', 'email', 'userId'], 'indexed_fields');
    }
  );
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('login_method');
}
