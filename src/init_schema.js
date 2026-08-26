export async function up(knex) {
  // 1. Users Table (Website Owners)
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 2. Widgets Table (Owner Forms)
  await knex.schema.createTable('widgets', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table
      .uuid('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .notNullable();
    table.string('public_api_key').unique().notNullable();
    table.string('title').notNullable();
    table.text('allowed_origins').notNullable(); // JSON Array e.g. ["http://localhost:4000"]
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 3. Submissions Table (Visitor Leads)
  await knex.schema.createTable('submissions', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table
      .uuid('widget_id')
      .references('id')
      .inTable('widgets')
      .onDelete('CASCADE')
      .notNullable();
    table.text('data').notNullable(); // JSON object string
    table.string('ip_address');
    table.text('geo_data'); // JSON object string
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('submissions');
  await knex.schema.dropTableIfExists('widgets');
  await knex.schema.dropTableIfExists('users');
}