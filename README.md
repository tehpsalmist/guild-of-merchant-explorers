[Check it out live](https://guild-of-merchant-explorers.vercel.app)

Spin it up locally:

```sh
git clone $url && cd guild-of-merchant-explorers
npm i
npm run dev
```

Vite uses `VITE_NHOST_SUBDOMAIN` and `VITE_NHOST_REGION` for the Nhost configuration. The former
`REACT_APP_NHOST_*` names remain supported so existing local and Vercel environment settings keep working.

[Game's Instruction Manual](https://www.alderac.com/wp-content/uploads/2022/08/TGOME-Rulebook_web.pdf)

TypeScript and GraphQL development:

- `npm run codegen` refreshes the user-role schema from Nhost and regenerates operation types.
  Set `NHOST_BACKEND_ROOT` / `NHOST_SUBDOMAIN` to target a different backend.
- `npm run codegen:types` regenerates types using the existing local `graphql.schema.graphql`.
- Each `gql` export in `src/graphql/queries.ts` and `mutations.ts` carries its generated
  `TypedDocumentNode<Result, Variables>` annotation. Add both generated types when adding an operation;
  consumers infer results and variables automatically, including Nhost requests and Apollo subscriptions.
- JSON scalars are `unknown`: validate the payload before using application-specific fields.
  Unmapped custom scalars fail generation.
- `npm run check` runs strict TypeScript (including compile-only GraphQL regression checks) and
  ESLint rules rejecting explicit `any` and unsafe uses of library-provided `any`.
  `npm run build` runs these checks before bundling. Dependency declarations are skipped by TypeScript;
  application code and generated types are checked.

Saved local games still use a documented `SerializedGameState` assertion at the JSON boundary:
these are written by this application's serializer, and restoration exceptions fall back to a new game.
This is a trust assumption, not runtime schema validation.
