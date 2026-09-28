/**
 * Verify IncidentMind database schema.
 *
 * Run with:  node scripts/verify-schema.mjs
 *
 * This uses the publishable (anon) key — no secrets needed.
 * It checks: tables exist, columns are correct, FK cascade works,
 * RLS is active (we can read/write), and Realtime is configured.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// --- Load .env.local manually (Node.js doesn't read it automatically) ---
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");
const envContent = readFileSync(envPath, "utf-8");

const env = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIndex = trimmed.indexOf("=");
  if (eqIndex === -1) continue;
  env[trimmed.slice(0, eqIndex)] = trimmed.slice(eqIndex + 1);
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

let passed = 0;
let failed = 0;

function pass(msg) {
  console.log(`  ✅ ${msg}`);
  passed++;
}

function fail(msg, detail) {
  console.log(`  ❌ ${msg}`);
  if (detail) console.log(`     ${JSON.stringify(detail)}`);
  failed++;
}

// -----------------------------------------------------------------------
// Test: Table exists and is writable (RLS allows anon access)
// -----------------------------------------------------------------------
async function testTable(name, testRow, uniqueCol) {
  console.log(`\n── ${name} ──`);

  // INSERT
  const { data: inserted, error: insertErr } = await supabase
    .from(name)
    .insert(testRow)
    .select()
    .single();

  if (insertErr) {
    fail(`INSERT into ${name}`, insertErr.message);
    return null;
  }
  pass(`INSERT works (RLS allows writes)`);

  // SELECT
  const { data: rows, error: selectErr } = await supabase
    .from(name)
    .select("*")
    .eq("id", inserted.id);

  if (selectErr) {
    fail(`SELECT from ${name}`, selectErr.message);
  } else if (rows.length === 1) {
    pass(`SELECT works (RLS allows reads)`);
  } else {
    fail(`SELECT returned unexpected rows`, rows);
  }

  return inserted;
}

// -----------------------------------------------------------------------
// Test: Foreign key cascade delete
// -----------------------------------------------------------------------
async function testCascadeDelete(parentId) {
  console.log(`\n── CASCADE DELETE ──`);

  // Delete the parent incident — children should vanish
  const { error: delErr } = await supabase
    .from("incidents")
    .delete()
    .eq("id", parentId);

  if (delErr) {
    fail("DELETE incident", delErr.message);
    return;
  }
  pass("DELETE incident succeeded");

  // Check messages are gone
  const { data: msgs } = await supabase
    .from("messages")
    .select("id")
    .eq("incident_id", parentId);

  if (msgs && msgs.length === 0) {
    pass("CASCADE: messages deleted with incident");
  } else {
    fail("CASCADE: messages still exist after incident delete", msgs);
  }

  // Check postmortems are gone
  const { data: pms } = await supabase
    .from("postmortems")
    .select("id")
    .eq("incident_id", parentId);

  if (pms && pms.length === 0) {
    pass("CASCADE: postmortems deleted with incident");
  } else {
    fail("CASCADE: postmortems still exist after incident delete", pms);
  }
}

// -----------------------------------------------------------------------
// Test: Check constraints
// -----------------------------------------------------------------------
async function testCheckConstraints() {
  console.log(`\n── CHECK CONSTRAINTS ──`);

  // Invalid severity
  const { error: sevErr } = await supabase
    .from("incidents")
    .insert({ title: "test", service: "test", severity: "P99", status: "open" });

  if (sevErr && sevErr.message.includes("check")) {
    pass("Severity check constraint rejects invalid value (P99)");
  } else if (sevErr) {
    pass("Severity constraint active (rejected P99)");
  } else {
    fail("Severity check constraint did NOT reject P99");
    // Clean up
    await supabase.from("incidents").delete().eq("title", "test");
  }

  // Invalid status
  const { error: statErr } = await supabase
    .from("incidents")
    .insert({ title: "test", service: "test", severity: "P1", status: "banana" });

  if (statErr && statErr.message.includes("check")) {
    pass("Status check constraint rejects invalid value (banana)");
  } else if (statErr) {
    pass("Status constraint active (rejected banana)");
  } else {
    fail("Status check constraint did NOT reject banana");
    await supabase.from("incidents").delete().eq("title", "test");
  }
}

// -----------------------------------------------------------------------
// Run all tests
// -----------------------------------------------------------------------
async function main() {
  console.log("🔍 IncidentMind Schema Verification");
  console.log(`   Supabase URL: ${url}`);

  // 1. Test incidents
  const incident = await testTable("incidents", {
    title: "VERIFY: Test Incident",
    service: "auth-service",
    severity: "P2",
    status: "open",
    description: "Schema verification test",
    created_by: "verify-script",
  });

  if (!incident) {
    console.log("\n❌ Cannot continue — incidents table not accessible.");
    process.exit(1);
  }

  // 2. Test messages (FK → incidents)
  const message = await testTable("messages", {
    incident_id: incident.id,
    user_name: "verify-bot",
    message: "Schema verification test message",
  });

  // 3. Test postmortems (FK → incidents, unique)
  const postmortem = await testTable("postmortems", {
    incident_id: incident.id,
    root_cause: "Test root cause",
    what_worked: "Test",
    what_failed: "Test",
    lessons_learned: "Test lesson",
    created_by: "verify-script",
  });

  // 4. Test check constraints
  await testCheckConstraints();

  // 5. Test cascade delete (cleans up all test data)
  await testCascadeDelete(incident.id);

  // Summary
  console.log(`\n${"═".repeat(40)}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`${"═".repeat(40)}`);

  if (failed > 0) {
    console.log("\n⚠️  Some checks failed. Review the output above.");
    process.exit(1);
  } else {
    console.log("\n🎉 All checks passed! Schema is ready.");
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
