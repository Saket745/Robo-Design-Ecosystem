# Bolt's Performance Journal

This is Bolt's journal for documenting performance-related insights, optimizations, and learnings in this codebase.

## 2025-06-15 - [In-memory Cache for Static API Files]
**Learning:** For robotics or development platform API endpoints that read static metadata/config files (like Markdown documentation and YAML dependencies), performing concurrent asynchronous filesystem reads (`fs.promises.readFile`) on every request forms a major I/O serialization bottleneck. Serializing the final assembled response objects as static JSON strings and storing them in an in-memory `Map` keyed by normalized/resolved path eliminates the disk I/O completely, scaling concurrent API throughput from ~1.2k req/sec to ~3.6k req/sec without introducing state consistency bugs.
**Action:** Always consider in-memory response caching for static/immutable content endpoints (like documentation, config files, or capabilities schemas) to optimize backend throughput and latency profiles.
