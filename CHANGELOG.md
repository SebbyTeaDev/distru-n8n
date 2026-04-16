# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.1.10] - 2026-04-16

### Changed

- **Distru** node **typeVersion 5**: Operation-specific field definitions. Each operation now displays only the fields relevant to that specific API endpoint, replacing the generic **Body** JSON field and **Additional Query Parameters** with tailored form fields.
  - **POST operations** (e.g., `postAdjustment`, `upsertProduct`, `upsertOrder`) now show dedicated fields for required parameters and an **Additional Fields** collection for optional parameters
  - **GET operations** now have an **Additional Fields** collection with pagination and filter options specific to each endpoint
  - Improved validation and user experience with clear field labels, descriptions, and required field indicators
  - Request bodies are now built programmatically from form fields instead of requiring manual JSON construction

### Migration from typeVersion 4

- Upgrade the node to v5. Operations that previously used the **Body** JSON field will now show operation-specific form fields. For example:
  - `postAdjustment`: Now shows individual fields for **Product ID**, **Batch ID**, **Package ID**, **Completion Datetime**, **Reason**, etc., instead of a JSON body
  - `upsertOrder`: Shows **Company ID** as a required field, with **Items** and **Charges** as structured collections
  - All GET operations: Use the **Additional Fields** collection for pagination (`page_number`, `page_size`) and filters instead of **Page Number**, **Page Size**, and **Additional Query Parameters** fields
- If upgrading from workflows with JSON body content, manually map the JSON fields to the new form fields

[4.1.10]: https://github.com/SebbyTeaDev/distru-n8n/compare/v4.1.9...v4.1.10

## [4.1.9] - 2026-04-16

### Changed

- **Distru** node **typeVersion 4**: **Resource** + **Operation** layout (same idea as the built-in **n8n** node). One `Operation` field per resource value, each scoped with `displayOptions.show.resource`, so the action catalog and node details list actions under endpoint-style sections instead of one flat list.

### Migration from typeVersion 3

- Upgrade the node to v4. Choose **Resource** first, then **Operation**. Saved workflows still run from the stored `operation` value; set **Resource** to match for a clear UI.

[4.1.9]: https://github.com/SebbyTeaDev/distru-n8n/compare/v4.1.8...v4.1.9

## [4.1.8] - 2026-04-16

### Changed

- **Distru** node **typeVersion 3**: replaced the **Query** JSON field with native **Page Number**, **Page Size**, and **Additional Query Parameters** (name/value rows). Replaced multipart **Form Data** JSON with **Additional Form Fields**. **Body** remains JSON for nested upsert payloads (orders, invoices, purchases, etc.).

### Migration from typeVersion 2

- Upgrade each **Distru** node to v3 in the editor. Map old `query` keys into **Additional Query Parameters**; use **Page Number** / **Page Size** instead of `page` / `page_number` / `page_size` inside JSON. Use **0** for both page fields to omit `page[number]` / `page[size]` (same as an empty query before).

[4.1.8]: https://github.com/SebbyTeaDev/distru-n8n/compare/v4.1.7...v4.1.8

## [4.1.7] - 2026-04-15

### Changed

- **Source tree** matches git commit [`b307f0a`](https://github.com/SebbyTeaDev/distru-n8n/commit/b307f0a) (repository URL fix on top of the **3.0.1**-era **Distru** + **Distru Trigger** implementation): one **Distru** action node with a flat **Operation** list (no **Resource** / **Operation** two-step UI from **4.1.0**), and no **4.0.0** per-resource split nodes.
- Published on npm as **4.1.7** only for versioning continuity; this is **not** a continuation of the **4.0.x–4.1.6** code paths that briefly lived on `master` after that commit.

### Migration

- If you used **4.1.x** (**Resource** + **Operation**) or **4.0.x** split nodes, re-map workflows to this node’s **Operation** values (same internal keys as in **3.x** / this tree). Re-check filters, query, body, and IDs after upgrading or downgrading.

[4.1.7]: https://github.com/SebbyTeaDev/distru-n8n/compare/v4.1.6...v4.1.7
