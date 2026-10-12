// Copia de seguridad de los datos (no del esquema: el esquema vive en supabase/migrations).
// Uso: npm run backup  →  backups/AAAA-MM-DD/<tabla>.json
// Lee las claves de .env.local. La carpeta backups/ tiene datos personales: está en .gitignore.
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const TABLES = [
  "profiles", "teachers", "students", "student_level_history", "classes", "teacher_availability",
  "learning_materials", "assignments", "progress_records", "plans", "subscriptions", "payments",
  "webhook_events", "notifications",
];
const PAGE = 1000;

const supabase = createClient(url, key, { auth: { persistSession: false } });
const dir = join("backups", new Date().toISOString().slice(0, 10));
mkdirSync(dir, { recursive: true });

let failed = false;
for (const table of TABLES) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from(table).select("*").range(from, from + PAGE - 1);
    if (error) {
      console.error(`✗ ${table}: ${error.message}`);
      failed = true;
      break;
    }
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  writeFileSync(join(dir, `${table}.json`), JSON.stringify(rows, null, 2));
  console.log(`✓ ${table}: ${rows.length}`);
}

// Cuentas de acceso (emails y metadatos; las contraseñas no son exportables)
const users = [];
for (let page = 1; ; page++) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: PAGE });
  if (error) {
    console.error(`✗ auth.users: ${error.message}`);
    failed = true;
    break;
  }
  users.push(...data.users);
  if (data.users.length < PAGE) break;
}
writeFileSync(join(dir, "auth_users.json"), JSON.stringify(users, null, 2));
console.log(`✓ auth.users: ${users.length}`);

console.log(failed ? `\nCopia INCOMPLETA en ${dir}` : `\nCopia completa en ${dir}`);
process.exit(failed ? 1 : 0);
