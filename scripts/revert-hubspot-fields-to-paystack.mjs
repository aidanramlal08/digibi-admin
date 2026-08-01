// One-off script: clones the four digibi_yoco_* Deal properties back to
// digibi_paystack_* (matching the n8n Client Onboarding workflow) and
// archives the yoco ones. No data is lost — nothing has ever been written to
// these fields, so this is a safe rename-via-clone.
//
// Usage:
//   HUBSPOT_TOKEN=pat-xxxx node scripts/revert-hubspot-fields-to-paystack.mjs
//
// The token needs the crm.schemas.deals.write scope (HubSpot Private App).

const TOKEN = process.env.HUBSPOT_TOKEN;
if (!TOKEN) {
  console.error("Set HUBSPOT_TOKEN to a Private App token with crm.schemas.deals.write scope.");
  process.exit(1);
}

const RENAMES = [
  { from: "digibi_yoco_reference", to: "digibi_paystack_reference", label: "Digibi Paystack Reference" },
  { from: "digibi_yoco_authorization_code", to: "digibi_paystack_authorization_code", label: "Digibi Paystack Authorization Code" },
  { from: "digibi_yoco_checkout_url", to: "digibi_paystack_checkout_url", label: "Digibi Paystack Checkout URL" },
  { from: "digibi_yoco_customer_code", to: "digibi_paystack_customer_code", label: "Digibi Paystack Customer Code" },
];

const BASE = "https://api.hubapi.com/crm/v3/properties/deals";
const headers = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };

async function getProperty(name) {
  const res = await fetch(`${BASE}/${name}`, { headers });
  if (!res.ok) throw new Error(`GET ${name} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function createProperty(def) {
  const res = await fetch(BASE, { method: "POST", headers, body: JSON.stringify(def) });
  if (!res.ok) throw new Error(`CREATE ${def.name} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function archiveProperty(name) {
  const res = await fetch(`${BASE}/${name}`, { method: "DELETE", headers });
  if (!res.ok && res.status !== 204) throw new Error(`ARCHIVE ${name} failed: ${res.status} ${await res.text()}`);
}

for (const { from, to, label } of RENAMES) {
  console.log(`\n${from} -> ${to}`);
  const src = await getProperty(from);
  await createProperty({
    name: to,
    label,
    type: src.type,
    fieldType: src.fieldType,
    groupName: src.groupName,
    description: src.description || "",
  });
  console.log(`  created ${to}`);
  await archiveProperty(from);
  console.log(`  archived ${from}`);
}

console.log("\nDone. All four fields are back to digibi_paystack_*.");
