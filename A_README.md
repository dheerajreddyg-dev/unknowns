# AIX Cache

Axios-style cache for AI responses.

This monorepo ships a production-focused TypeScript SDK in `packages/js` and a Python SDK in `packages/python` with exact/semantic cache flows and multi-provider support.

## Monorepo Layout

- `packages/js`: TypeScript SDK (current MVP target)
- `packages/python`: Python SDK (exact/semantic cache baseline, multi-provider support, parity plan)
- `docs/architecture.md`: cache-first architecture and safety strategy
- `docs/roadmap.md`: phased roadmap from v0.1 to v1.0
- `docs/testing-strategy.md`: unit, contract, and integration-like testing approach
- `docs/cache-strategy.md`: exact, semantic, and invalidation strategy
- `docs/semantic-cache.md`: semantic matching and safety boundaries
- `docs/rag-cache.md`: RAG-specific keying and invalidation
- `docs/redis.md`: Redis adapter design and operations notes
- `docs/publishing.md`: npm/PyPI publishing and versioning strategy
- `docs/api-reference.md`: TypeScript API reference summary
- `docs/python-sdk-plan.md`: Python parity plan and implementation status
- `docs/governance.md`: maintainer policy, stability, and RFC process
- `docs/release-readiness-checklist.md`: practical release gate checklist
- `docs/status-matrix.md`: implementation status by feature and ecosystem

## Current Status

The project currently includes a working TypeScript baseline with:

- `AIXCache` client
- memory adapter
- exact cache
- semantic cache with local embedding provider
- provider adapters for OpenAI, Azure OpenAI, Claude, Gemini, Ollama, Groq, and OpenRouter
- Axios-style interceptors
- middleware pipeline and presets
- analytics snapshot API
- Vitest tests

The Python package currently includes:

- `AIXCache` with exact/semantic cache flow
- memory adapter and deterministic local embeddings
- provider adapters for OpenAI, Azure OpenAI, Claude, Gemini, Groq, Ollama, and OpenRouter
- custom provider adapter injection for advanced integrations
- RAG, tool, and stream cache-aware APIs