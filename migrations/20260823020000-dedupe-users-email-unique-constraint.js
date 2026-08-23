"use strict";

// Repeated `sequelize.sync({ alter: true })` calls over the years left
// several redundant UNIQUE constraints on Users.Email (Users_Email_key,
// _key1, _key2, ...) — production had 4, the dev branch had 2. This keeps
// exactly one (the lexicographically first, i.e. the original
// "Users_Email_key") and drops the rest, whatever the count in a given
// environment. Written dynamically since the duplicate count differs per
// environment rather than hardcoding constraint names.
module.exports = {
  up: async (queryInterface) => {
    const [constraints] = await queryInterface.sequelize.query(`
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.table_name = 'Users'
        AND tc.table_schema = 'public'
        AND tc.constraint_type = 'UNIQUE'
        AND kcu.column_name = 'Email'
      ORDER BY tc.constraint_name;
    `);

    const names = constraints.map((c) => c.constraint_name).sort();
    const [keep, ...drop] = names;

    for (const name of drop) {
      await queryInterface.sequelize.query(
        `ALTER TABLE "Users" DROP CONSTRAINT "${name}";`
      );
    }

    if (drop.length === 0) {
      console.log(`No duplicate Email unique constraints found (kept: ${keep}).`);
    } else {
      console.log(`Kept "${keep}", dropped: ${drop.join(", ")}`);
    }
  },

  down: async () => {
    // Irreversible by design: the dropped constraints were redundant
    // duplicates, not distinct schema — nothing meaningful to restore.
  },
};
