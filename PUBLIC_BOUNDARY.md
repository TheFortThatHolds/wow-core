# Public source boundary

Public code is the reusable machinery, never an operator's life or deployment.
This applies to source, examples, comments, documentation, tests, screenshots,
generated files, release packages and commit metadata.

## Allowed

- Generic behavior, schemas, adapters and versioned interoperability contracts.
- Invented test identities and fixtures; reserved example domains.
- Placeholder-only configuration with each operator supplying their own values.
- Technical requirements and setup instructions for people or coding agents.
- Public project links and descriptions needed to connect these two tools.

## Not allowed

- Personal character records, exports, transcripts, notes or context graphs.
- An operator's names-data, email, private domains, service URLs or local paths.
- Account, application, client, tenant, storage, billing or private record IDs.
- Passwords, keys, tokens, cookies, encrypted settings or diagnostic artifacts.
- Private project source containing any of the above, even in comments/examples.
- A map of personal infrastructure or a dependency on the project author.

Non-secret does not mean appropriate to publish. Operator configuration belongs
in the operator's environment and intended credential store, not tracked files.
Do not copy private repositories wholesale and then try to scrub them afterward.

## Before every push or release

1. Review the exact staged file list and diff; stage explicit files only.
2. Inspect every new example, fixture and configuration value for provenance.
3. Check for secrets, local paths, real identifiers and private source references.
4. Inspect generated/release contents separately; a clean source tree is not
   proof that a package contains no private data.
5. Use public-safe commit attribution and generic project handoffs.

Automated checks are a backstop, not proof of completeness. Stop publishing an
ambiguous file until its public suitability is resolved.
