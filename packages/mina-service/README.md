### Overview

The system processes document operations through a multi-tenant pipeline.
Operations first land in an unordered pool grouped by tenant. The Merkle Tree
Worker polls from this pool and processes operations in strict sequential order
for each tenant (ensuring each operation's sequence number matches the expected
next number). It then queues proof tasks for the Proof Worker to consume. While
operations from different tenants can be processed concurrently, operations
within each tenant maintain strict ordering through both workers. This
architecture enables parallel processing across tenants while preserving
sequential guarantees within each tenant's operations.

```text
Document Operations        Merkle Tree Worker              Proof Worker
      Pool                (Per-tenant Ordering)         (Per-tenant Ordering)

Tenant A:                   ┌──────────────┐            ┌─────────────┐
 [Op4]  [Op1]               │ Tenant A:    │            │ Tenant A:   │
 [Op7]  [Op2]  ═══Poll═══>  │ Check Seq #  │  ═══>      │ Process     │
                            │ Process Ops  │            │ Proofs      │
Tenant B:                   └──────────────┘            └─────────────┘
 [Op3]  [Op6]               ┌─────────────┐            ┌─────────────┐
 [Op5]  [Op8]  ═══Poll═══>  │ Tenant B:   │  ═══>      │ Tenant B:   │
     │                      │ Check Seq # │            │ Process     │
     │                      │ Process Ops │            │ Proofs      │
     ▼                      └─────────────┘            └─────────────┘
New ops arrive
(unordered)                  Concurrent but              Concurrent but
                            ordered per tenant          ordered per tenant

Sequential Flow (per tenant): ━━━━━━━━━━━━━━━━━━━━━━》
                             1 → 2 → 3 → 4 → 5 → ...
```

While the diagram might suggest we have a dedicated worker per tenant, the
actual implementation uses a pool of workers that dynamically process
operations across different tenants. These workers automatically multiplex
operations for different tenants while maintaining per-tenant ordering
guarantees. The diagram is simplified to illustrate this per-tenant ordering
concept.

## License

[Apache-2.0](LICENSE)

