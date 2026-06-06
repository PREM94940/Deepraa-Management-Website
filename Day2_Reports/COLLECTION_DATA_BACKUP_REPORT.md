# COLLECTION DATA BACKUP REPORT
**Date:** 2026-06-06T06:34:04.429Z
**Status:** ✅ BACKUP COMPLETE
**Backup File:** `D:\Luxary Deeprastore by Ag and Chatgpt\scripts\product_collections_backup.json`

---

## Backup Summary

| Metric | Value |
|:---|:---|
| **Table Backed Up** | `product_collections` |
| **Row Count** | **169 rows** |
| **Backup File Size** | 66,460 bytes (~65 KB) |
| **Export Timestamp** | 2026-06-06T06:34:04.429Z |
| **Export Method** | Node.js script via `@supabase/supabase-js` (read-only anon key) |
| **Export Script** | `scripts/db_full_backup_query.mjs` |
| **Backup File Path** | `scripts/product_collections_backup.json` |
| **Integrity Verified** | ✅ YES — `ConvertFrom-Json` row count = 169 |

---

## Table Verified as NOT Modified

The `product_collections` table was only **read**, never modified. No writes were performed during backup.

Evidence query output:
```
Row count: 169
Columns: product_id, collection_id, created_at
```

---

## Backup File Structure

```json
{
  "exported_at": "2026-06-06T06:34:04.429Z",
  "table": "product_collections",
  "row_count": 169,
  "data": [
    {
      "product_id": "0b5e982a-745b-4c62-a3cf-a35300b04194",
      "collection_id": "09b7bbe6-4c60-4429-852e-d9fc757e1288",
      "created_at": "2026-06-03T11:24:09.945715+00:00"
    },
    ...169 rows total
  ]
}
```

---

## Data Distribution Across Collections

From the live DB query, assignments span these collections:

| Collection Name | Collection ID |
|:---|:---|
| Ready Wear Half Saree | `09b7bbe6-...` |
| Pattu Collection | `a74d5b1c-...` |
| Bridal Collection | `7d92ab76-...` |
| Wedding Collection | `6c96eef8-...` |
| Designer Collection | `6c9d521b-...` |
| Festival Collection | `4935a502-...` |
| Ready To Ship Collection | `66b1cc77-...` |
| Best Sellers | `9a5601cf-...` |
| New Arrivals | `71f2ed47-...` |
| Premium Collection | `466d9330-...` |
| Recovered Collection 0 | `19a768e0-...` |
| Recovered Collection 1 | `168ddcf6-...` |
| Recovered Collection 2 | `2bef9b95-...` |

---

## Table Preservation Decision

> [!IMPORTANT]
> `product_collections` will **NOT be dropped** during this migration.
> It is retained as a passive on-database backup.
> A future cleanup migration (`20260636000001_drop_legacy_product_collections.sql`) will be created after 30-day verification.

Current tables after migration:
- `product_collections` — **169 rows, unchanged, preserved** (legacy backup)
- `collection_products` — **169 rows migrated in, formally structured** (canonical)

---

## Emergency Restore Procedure

If data loss is detected after migration, restore using:

```javascript
// Emergency restore to collection_products from local backup
import backup from './scripts/product_collections_backup.json' assert { type: 'json' };
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const restoreData = backup.data.map((r, i) => ({
  collection_id: r.collection_id,
  product_id: r.product_id,
  position: 0,
  created_at: r.created_at
}));

const { error } = await supabase
  .from('collection_products')
  .insert(restoreData);

console.log(error ? 'RESTORE FAILED:' + error.message : 'RESTORE COMPLETE');
```

Or restore directly from `product_collections` (still in DB):
```sql
INSERT INTO public.collection_products (collection_id, product_id, position, created_at)
SELECT collection_id, product_id::text, 0, created_at
FROM public.product_collections
ON CONFLICT (collection_id, product_id) DO NOTHING;
```

---

## Pre-Migration Checklist

- [x] `product_collections` row count confirmed: **169**
- [x] `collection_products` row count confirmed: **0**
- [x] JSON backup exported: **scripts/product_collections_backup.json**
- [x] Backup integrity verified: **66,460 bytes, 169 rows**
- [x] Migration SQL written: **20260606000001_canonicalize_collection_products.sql**
- [x] Rollback plan documented: COLLECTION_DATABASE_MIGRATION_PLAN.md
- [x] `product_collections` confirmed NOT dropped in migration
- [ ] Migration applied to live DB
- [ ] Post-migration row count verified
- [ ] Admin catalog code updated
- [ ] Browser end-to-end test completed

---

*No data was modified during backup. Read-only operation.*
