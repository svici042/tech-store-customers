const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const { mkdtemp, rm } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { test } = require("node:test");

async function start(cwd) {
  const child = spawn(process.execPath, [join(__dirname, "..", "server.js")], {
    cwd,
    env: { ...process.env, PORT: "0" },
    stdio: ["ignore", "pipe", "inherit"],
  });
  const exited = once(child, "close");
  const stop = async () => {
    child.kill();
    await exited;
  };
  const timer = setTimeout(() => child.kill(), 10_000);
  let output = "";
  try {
    // Read the actual address from this child before sending any requests.
    const address = await Promise.race([
      (async () => {
        for await (const chunk of child.stdout.iterator({ destroyOnReturn: false })) {
          output += chunk;
          const ready = output.match(/^Server running at (http:\/\/127\.0\.0\.1:([1-9]\d*))\r?\n/m);
          if (ready) return ready[1];
        }
        assert.fail(`Server did not start. ${output}`);
      })(),
      exited.then(([code]) => assert.fail(`Server exited with code ${code}`)),
    ]);
    assert.match(output, /Database connected successfully/);
    assert.match(output, /Database tables synchronized/);
    return { url: `${address}/customers`, stop };
  } catch (error) {
    await stop().catch(() => {});
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function post(url, body) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

test("Customer API validates, stores and reloads records", async () => {
  // SQLite uses the child process's working directory for its database.
  const cwd = await mkdtemp(join(tmpdir(), "customer-api-"));
  let server;
  try {
    server = await start(cwd);
    const created = await post(server.url, JSON.stringify({
      name: "  Test Customer  ",
      email: "  test@example.com  ",
    }));
    assert.equal(created.status, 201);
    const customer = await created.json();
    assert.deepEqual(Object.keys(customer).sort(), [
      "createdAt", "email", "id", "name", "updatedAt",
    ]);
    assert.equal(customer.id, 1);
    assert.equal(customer.name, "Test Customer");
    assert.equal(customer.email, "test@example.com");

    const listed = await fetch(server.url);
    assert.equal(listed.status, 200);
    assert.deepEqual(await listed.json(), [customer]);

    for (const [name, email] of [
      [undefined, customer.email],
      [customer.name, undefined],
      [123, customer.email],
      [customer.name, []],
      ["", customer.email],
      ["   ", customer.email],
      [customer.name, "   "],
      [customer.name, "invalid@example"],
      ["a".repeat(101), customer.email],
      [customer.name, "a".repeat(243) + "@example.com"],
    ]) {
      const response = await post(server.url, JSON.stringify({ name, email }));
      assert.equal(response.status, 400);
      assert.equal(typeof (await response.json()).error, "string");
    }
    const malformed = await post(server.url, '{"name":');
    assert.equal(malformed.status, 400);
    assert.deepEqual(await malformed.json(), { error: "Invalid JSON body." });

    await server.stop();
    server = undefined;
    server = await start(cwd);
    const persisted = await fetch(server.url);
    assert.equal(persisted.status, 200);
    assert.deepEqual(await persisted.json(), [customer]);
  } finally {
    try {
      await server?.stop();
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  }
});
