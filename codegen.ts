import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'graphql.schema.graphql',
  documents: ['src/**/*.{ts,tsx}', '!src/**/*.generated.ts'],
  generates: {
    'src/graphql/types.generated.ts': {
      plugins: ['typescript-operations'],
      config: {
        strictScalars: true,
        defaultScalarType: 'unknown',
        scalars: {
          jsonb: 'unknown',
          timestamptz: 'string',
          uuid: 'string',
        },
      },
    },
  },
}

export default config
