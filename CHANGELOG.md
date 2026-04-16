# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.1.7] - 2026-04-15

### Changed

- **Source tree** matches git commit [`b307f0a`](https://github.com/SebbyTeaDev/distru-n8n/commit/b307f0a) (repository URL fix on top of the **3.0.1**-era **Distru** + **Distru Trigger** implementation): one **Distru** action node with a flat **Operation** list (no **Resource** / **Operation** two-step UI from **4.1.0**), and no **4.0.0** per-resource split nodes.
- Published on npm as **4.1.7** only for versioning continuity; this is **not** a continuation of the **4.0.x–4.1.6** code paths that briefly lived on `master` after that commit.

### Migration

- If you used **4.1.x** (**Resource** + **Operation**) or **4.0.x** split nodes, re-map workflows to this node’s **Operation** values (same internal keys as in **3.x** / this tree). Re-check filters, query, body, and IDs after upgrading or downgrading.

[4.1.7]: https://github.com/SebbyTeaDev/distru-n8n/compare/v4.1.6...v4.1.7
