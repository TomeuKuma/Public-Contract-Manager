---
description: Clear all contract data (contracts, lots, credits, invoices) from the database while preserving reference tables.
---
1. Verify that you have access to the `supabase-mcp-server`.
2. Execute a SQL script to delete data from the following tables in this specific order to respect foreign key constraints:
   - `invoices`
   - `credits`
   - `lots`
   - `contract_areas`
   - `contract_centers`
   - `contracts`
3. Ensure that you DO NOT delete data from reference tables such as `areas`, `centers`, `cpv_codes`, or `users`.
4. Verify that the data has been cleared by counting the rows in the affected tables (should be 0).
5. Verify that the reference tables still contain data.
