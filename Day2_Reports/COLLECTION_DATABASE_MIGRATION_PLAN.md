# COLLECTION DATABASE MIGRATION PLAN
**Date:** 2026-06-06
**Type:** Pre-Implementation Planning Document
**Verified Against:** Live Supabase DB — `awyqinnivsvqsohfmmcj.supabase.co`

---

## 1. Existing Schema: `product_collections`

**Source:** Live DB introspection via `db_evidence_query.mjs`

### Verified Columns (from actual row data):
```
product_id    UUID   — References products.id
collection_id UUID   — References collections.id
created_at    TIMESTAMPTZ
```

### What is MISSING (inferred from code):
- ❌ No `id` primary key column
- ❌ No `position` column (no curation ordering)
- ❌ No `UNIQUE(product_id, collection_id)` constraint
- ❌ No formal foreign key constraints
- ❌ Not defined in any migration file (ad-hoc table)
- ❌ No RLS policies

### Live Row Count:
```
ROWS: 169
```

### Sample Records:
```json
{"product_id": "0b5e982a-745b-4c62-a3cf-a35300b04194", "collection_id": "09b7bbe6-4c60-4429-852e-d9fc757e1288", "created_at": "2026-06-03T11:24:09.945715+00:00"}
{"product_id": "188b59e6-98ab-4755-aaf0-d7019ec0df6b", "collection_id": "09b7bbe6-4c60-4429-852e-d9fc757e1288", "created_at": "2026-06-03T11:24:09.945715+00:00"}
{"product_id": "cb4412cb-ef27-4e1f-bb69-fd347d7d2bf8", "collection_id": "a74d5b1c-d776-4418-866b-364fa41b1ad9", "created_at": "2026-06-03T19:27:07.286215+00:00"}
```

### Associated Collections (13 total):
| Collection ID (truncated) | Name | Type |
|:---|:---|:---|
| `09b7bbe6` | Ready Wear Half Saree | smart |
| `a74d5b1c` | Pattu Collection | manual |
| `7d92ab76` | Bridal Collection | manual |
| `6c96eef8` | Wedding Collection | manual |
| `6c9d521b` | Designer Collection | manual |
| `4935a502` | Festival Collection | manual |
| `66b1cc77` | Ready To Ship Collection | manual |
| `9a5601cf` | Best Sellers | manual |
| `71f2ed47` | New Arrivals | manual |
| `466d9330` | Premium Collection | manual |
| `19a768e0` | Recovered Collection 0 | manual |
| `168ddcf6` | Recovered Collection 1 | manual |
| `2bef9b95` | Recovered Collection 2 | manual |

---

## 2. Existing Schema: `collection_products`

**Source:** Live DB introspection via `db_evidence_query.mjs`

### Verified Columns:
```
UNKNOWN — table exists but has 0 rows
```

The table exists in the live database (no 42P01 error) but contains **zero records**.

### Live Row Count:
```
ROWS: 0
```

### Status:
The table was created at some point (the CMS editor code references it) but was **never populated**. It is an empty shell. The code that should write to it (`admin/editor/page.tsx` `handleSaveCollection`) was never triggered with real data.

---

## 3. Row Counts Summary

| Table | Rows | Has Real Data? | Written By |
|:---|:---|:---|:---|
| `product_collections` | **169** | ✅ YES | Admin Catalog |
| `collection_products` | **0** | ❌ NO | CMS Editor (never used) |
| `products` | 202 | ✅ YES | Shopify import + admin |
| `collections` | 13 | ✅ YES | CMS Editor |

---

## 4. Revised Canonical Table Decision

> [!IMPORTANT]
> The live DB evidence **reverses** the Day 1 audit recommendation.
>
> `product_collections` has **169 rows of real production data**.
> `collection_products` has **0 rows**.
>
> The correct strategy is to **make `collection_products` a proper table** and **migrate the 169 rows into it**, then fix the storefront to use it. The admin catalog already populates `product_collections` — it needs only a minor schema alignment.

### Final Decision:
```
CANONICAL TABLE: collection_products

Reason:
  - The storefront (/collections/[slug]) reads from collection_products
  - The CMS Editor reads/writes to collection_products
  - collection_products has a 'position' column (for ordered curation)
  - collection_products can be formally defined with proper FKs + RLS

Strategy:
  - Migrate 169 rows from product_collections → collection_products (with position=0)
  - Formally define collection_products with migration
  - Update admin catalog to write to collection_products
  - collection_products becomes the single source of truth
```

---

## 5. Data Backup Strategy

### Step 1: JSON Export (COMPLETED)
- **File:** `scripts/product_collections_backup.json`
- **Rows:** 169
- **File Size:** 66,460 bytes
- **Timestamp:** 2026-06-06T06:34:04.429Z
- **Verification:** ✅ Row count confirmed via PowerShell `ConvertFrom-Json`

### Step 2: SQL Dump (In Migration)
The migration file itself includes an idempotent backup via `INSERT ... ON CONFLICT DO NOTHING` copying all `product_collections` rows into `collection_products` before any structural changes.

### Step 3: Retain `product_collections`
The old table **will NOT be dropped** in this migration. It will be left in place as a passive backup. Dropping it is a future cleanup task after 30-day verification.

---

## 6. Rollback Strategy

### If Migration Fails Mid-Run:
The migration uses `IF NOT EXISTS` and `ON CONFLICT DO NOTHING` throughout. A partial run can be re-run safely.

### If Storefront Breaks After Code Deploy:
Revert `admin/catalog/page.tsx` to the previous version (write to `product_collections`).
Revert `collections/[slug]/page.tsx` to read from `product_collections` (one-line change).

### If Data Loss Occurs:
Restore from `scripts/product_collections_backup.json` using:
```js
// Restore script (emergency only)
const backup = require('./scripts/product_collections_backup.json');
await supabase.from('product_collections').insert(backup.data);
// OR restore to collection_products:
await supabase.from('collection_products').insert(
  backup.data.map((r, i) => ({ collection_id: r.collection_id, product_id: r.product_id, position: i }))
);
```

### Full Rollback Sequence:
```
1. Revert admin/catalog/page.tsx (git revert or manual restore)
2. Revert collections/[slug]/page.tsx (git revert or manual restore)
3. The old product_collections table still has all 169 rows (it was not dropped)
4. System returns to original state in under 5 minutes
```

---

## 7. Migration Approach

### Phase A: Define `collection_products` formally
- Add `id` primary key
- Add foreign key to `collections`
- Add `UNIQUE(collection_id, product_id)` constraint
- Add RLS policies
- Add indexes

### Phase B: Migrate data
- Copy all 169 rows from `product_collections` into `collection_products`
- Assign `position = 0` (no ordering existed before)
- Use `ON CONFLICT DO NOTHING` for idempotency

### Phase C: Code changes
- Update `admin/catalog/page.tsx` to read/write `collection_products`
- The storefront (`collections/[slug]/page.tsx`) already reads from `collection_products` — **no change needed there**
- The CMS Editor already reads/writes `collection_products` — **no change needed there**

### Phase D: Verification
- Browser test: assign product → save → confirm in collection page

---

*Migration file: `supabase/migrations/20260606000001_canonicalize_collection_products.sql`*
*Data backup file: `scripts/product_collections_backup.json` (169 rows, 66,460 bytes)*
