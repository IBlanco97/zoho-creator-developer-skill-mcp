#!/usr/bin/env node
/**
 * Migration: Datos Profesionales
 *
 * 1. Scans all Nuevo_Empleado records for old picklist values
 * 2. Creates missing Catalogo_Profesional entries (Area+Tipo+Nombre)
 * 3. Updates new lookup fields (Profesion_Cat, Especialidad_Cat, etc.)
 *
 * Usage:
 *   node scripts/migrate-datos-profesionales.mjs --dry-run   (preview, no writes)
 *   node scripts/migrate-datos-profesionales.mjs             (execute)
 */

import axios from 'axios';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, '../../../../.env');
for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.+)$/);
  if (m) process.env[m[1]] = m[2].trim();
}

const DRY_RUN = process.argv.includes('--dry-run');
const OWNER   = process.env.ZOHO_OWNER_ID;
const APP     = process.env.ZOHO_APP_LINK_NAME;
const API_DOM = process.env.ZOHO_API_DOMAIN ?? 'www.zohoapis.com';
const BASE    = `https://${API_DOM}/creator/v2.1/data/${OWNER}/${APP}`;

// ── Auth ──────────────────────────────────────────────────────────────────────

async function getToken() {
  const r = await axios.post(
    `https://${process.env.ZOHO_ACCOUNTS_DOMAIN}/oauth/v2/token`,
    new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.ZOHO_CLIENT_ID,
      client_secret: process.env.ZOHO_CLIENT_SECRET,
      refresh_token: process.env.ZOHO_REFRESH_TOKEN,
    }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  if (!r.data.access_token) throw new Error('No access_token: ' + JSON.stringify(r.data));
  return r.data.access_token;
}

// ── API helpers ───────────────────────────────────────────────────────────────

function headers(token) {
  return { Authorization: `Zoho-oauthtoken ${token}`, Accept: 'application/json' };
}

async function getAll(token, report, criteria = null) {
  // v2.1 pagination requires `record_cursor` header — the legacy `from`
  // param returns duplicate pages (same 200 records forever).
  const records = [];
  const seen = new Set();
  let cursor = null;
  while (true) {
    const hdr = { ...headers(token) };
    if (cursor) hdr.record_cursor = cursor;
    const params = { limit: 200 };
    if (criteria) params.criteria = criteria;
    const r = await axios.get(`${BASE}/report/${report}`, {
      headers: hdr,
      params,
      timeout: 30000,
    });
    if (r.data.code && r.data.code !== 3000) break;
    const batch = r.data.data ?? [];
    for (const rec of batch) {
      if (seen.has(rec.ID)) continue;
      seen.add(rec.ID);
      records.push(rec);
    }
    cursor = r.headers['record_cursor'] || r.headers['Record_Cursor'];
    if (!cursor || batch.length < 200) break;
  }
  return records;
}

async function createCatalogEntry(token, area, tipo, nombre) {
  if (DRY_RUN) return 'DRY_RUN_ID';
  const r = await axios.post(
    `${BASE}/form/Catalogo_Profesional`,
    { data: { Area: area, Tipo: tipo, Nombre: nombre } },
    { headers: { ...headers(token), 'Content-Type': 'application/json' } }
  );
  if (r.data.code && r.data.code !== 3000) throw new Error(`Create catalog failed: ${JSON.stringify(r.data)}`);
  return r.data.data?.ID ?? r.data.ID;
}

async function updateEmployee(token, empId, payload) {
  if (DRY_RUN) return;
  const r = await axios.patch(
    `${BASE}/report/Employee_Details/${empId}`,
    { data: payload, skip_workflow: ['form_workflow', 'schedules'] },
    { headers: { ...headers(token), 'Content-Type': 'application/json' } }
  );
  if (r.data.code && r.data.code !== 3000) throw new Error(`Update emp ${empId} failed: ${JSON.stringify(r.data)}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(DRY_RUN ? '[DRY RUN]' : '[LIVE]', 'Migration: Datos Profesionales');
  const token = await getToken();
  console.log('✓ Auth OK');

  // 1. Load existing catalog → map "Area|Tipo|Nombre" → ID
  console.log('Loading Catalogo_Profesional...');
  const catRecs = await getAll(token, 'Catalogo_Profesional_Report');
  console.log(`  ${catRecs.length} existing entries`);

  const catMap = {}; // "Area|Tipo|Nombre" → ID
  for (const c of catRecs) {
    const key = `${c.Area}|${c.Tipo}|${c.Nombre}`;
    catMap[key] = c.ID;
  }

  // 2. Load employees from Mantenimiento Empleados (275 real records)
  console.log('Loading employees (Employee_Details)...');
  const emps = await getAll(token, 'Employee_Details');
  console.log(`  ${emps.length} employees`);

  // 3. Pass 1: collect all unique (Area, Tipo, Nombre) combos that are MISSING from catalog
  const FIELD_MAP = [
    { old: 'Profesion',              tipo: 'Profesion',    newF: 'Profesion_Cat' },
    { old: 'Especialidad1',          tipo: 'Especialidad', newF: 'Especialidad_Cat' },
    { old: 'Categoria_Profesional1', tipo: 'Categoria',    newF: 'Categoria_Cat' },
    { old: 'Puesto_laboral_actual',  tipo: 'Puesto',       newF: 'Puesto_Cat' },
  ];

  const toCreate = new Set(); // "Area|Tipo|Nombre"
  for (const emp of emps) {
    const area = emp.Area_Profesional;
    if (!area || area === '') continue;
    for (const { old, tipo } of FIELD_MAP) {
      const val = emp[old];
      if (!val || val === '') continue;
      const key = `${area}|${tipo}|${val}`;
      if (!catMap[key]) toCreate.add(key);
    }
  }

  console.log(`\n${toCreate.size} missing catalog entries to create:`);
  for (const k of [...toCreate].slice(0, 20)) console.log(`  + ${k}`);
  if (toCreate.size > 20) console.log(`  ... and ${toCreate.size - 20} more`);

  // 4. Pass 2: create missing catalog entries
  if (toCreate.size > 0) {
    console.log('\nCreating missing catalog entries...');
    let created = 0;
    for (const key of toCreate) {
      const [area, tipo, nombre] = key.split('|');
      try {
        const newId = await createCatalogEntry(token, area, tipo, nombre);
        catMap[key] = newId;
        created++;
        if (created % 10 === 0) console.log(`  Created ${created}/${toCreate.size}...`);
      } catch (e) {
        console.error(`  ✗ Failed to create "${key}": ${e.message}`);
      }
    }
    console.log(`  ✓ Created ${created} catalog entries`);
  }

  // 5. Pass 3: update employees with new lookup fields
  console.log('\nUpdating employees...');
  let updated = 0, skipped = 0, errors = 0;

  for (const emp of emps) {
    const area = emp.Area_Profesional;
    const payload = {};

    for (const { old, tipo, newF } of FIELD_MAP) {
      // Skip if new field already has a value
      const existing = emp[newF];
      if (existing && existing !== '' && existing !== '0') continue;

      const val = emp[old];
      if (!val || val === '') continue;

      if (!area) {
        console.warn(`  ⚠ emp ${emp.ID}: has ${old}="${val}" but no Area_Profesional — skipping`);
        continue;
      }

      const key = `${area}|${tipo}|${val}`;
      const catId = catMap[key];
      if (catId && catId !== 'DRY_RUN_ID') {
        payload[newF] = catId;
      } else if (catId === 'DRY_RUN_ID') {
        payload[newF] = `[WOULD_SET:${key}]`;
      } else {
        console.warn(`  ⚠ No catalog match for "${key}" (emp ${emp.ID})`);
      }
    }

    if (Object.keys(payload).length === 0) {
      skipped++;
      continue;
    }

    console.log(`  Updating emp ${emp.ID} (${emp.Nombre || ''}): ${Object.keys(payload).join(', ')}`);
    try {
      await updateEmployee(token, emp.ID, payload);
      updated++;
    } catch (e) {
      console.error(`  ✗ Error for ${emp.ID}: ${e.message}`);
      errors++;
    }
  }

  console.log(`\n=== ${DRY_RUN ? 'Preview' : 'Migration Complete'} ===`);
  console.log(`  Catalog entries ${DRY_RUN ? 'would create' : 'created'}: ${toCreate.size}`);
  console.log(`  Employees ${DRY_RUN ? 'would update' : 'updated'}: ${updated}`);
  console.log(`  Skipped (already set or no data): ${skipped}`);
  console.log(`  Errors: ${errors}`);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
