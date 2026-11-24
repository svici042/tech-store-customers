const assert = require("node:assert/strict");
const { createRequire } = require("node:module");
const { test } = require("node:test");
const { DataTypes, Sequelize } = require("sequelize");

// Resolve UUID from Sequelize so these tests cover the actual override.
const requireFromSequelize = createRequire(require.resolve("sequelize"));
const uuid = requireFromSequelize("uuid");

function assertVersion(value, version) {
  assert.ok(uuid.validate(value));
  assert.equal(uuid.version(value), version);
}

test("Sequelize loads the patched CommonJS UUID and uses it with SQLite", async (t) => {
  assert.equal(requireFromSequelize("uuid/package.json").version, "11.1.1");
  const db = new Sequelize({
    dialect: "sqlite",
    storage: ":memory:",
    logging: false,
  });
  t.after(() => db.close());
  const Record = db.define("Record", {
    first: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV1 },
    fourth: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },
  });

  await db.sync();
  await db.transaction(async (transaction) => {
    assertVersion(transaction.id, 4);
    const record = await Record.create({}, { transaction });
    await record.reload({ transaction });
    assertVersion(record.first, 1);
    assertVersion(record.fourth, 4);
  });
  const query = new db.dialect.Query({}, db, {});
  assertVersion(query.uuid, 4);
});

test("PostgreSQL SQL generation still produces a UUID v4 delimiter", (t) => {
  // Generate SQL without loading a PostgreSQL driver or connecting to a database.
  const db = new Sequelize("postgres://localhost/test", {
    dialectModule: {},
    logging: false,
  });
  t.after(() => db.close());
  const { query } = db.getQueryInterface().queryGenerator.insertQuery(
    "records",
    { name: "sample" },
    {},
    { exception: true },
  );
  const delimiters = query.match(/\$func_[0-9a-f]{32}\$/g);
  assert.equal(delimiters?.length, 2);
  assert.equal(delimiters[0], delimiters[1]);
  assert.match(delimiters[0], /^\$func_[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15}\$$/);
});

for (const [version, generate] of [
  [1, (buffer, offset) => uuid.v1({}, buffer, offset)],
  [3, (buffer, offset) => uuid.v3("example.com", uuid.v3.DNS, buffer, offset)],
  [4, (buffer, offset) => uuid.v4({}, buffer, offset)],
  [5, (buffer, offset) => uuid.v5("example.com", uuid.v5.DNS, buffer, offset)],
  [6, (buffer, offset) => uuid.v6({}, buffer, offset)],
]) {
  test(`UUID v${version} validates output buffer boundaries`, () => {
    assertVersion(generate(), version);

    for (const offset of [0, 2]) {
      const buffer = Buffer.alloc(18, 0xa5);
      assert.equal(generate(buffer, offset), buffer);
      assertVersion(uuid.stringify(buffer, offset), version);
      assert.deepEqual(buffer.subarray(0, offset), Buffer.alloc(offset, 0xa5));
      assert.deepEqual(buffer.subarray(offset + 16), Buffer.alloc(2 - offset, 0xa5));
    }

    for (const [size, offset] of [[15, 0], [30, -1], [30, 15]]) {
      const buffer = Buffer.alloc(size, 0xa5);
      assert.throws(() => generate(buffer, offset), RangeError);
      assert.deepEqual(buffer, Buffer.alloc(size, 0xa5));
    }
  });
}
