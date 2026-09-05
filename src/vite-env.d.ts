/// <reference types="vite/client" />

// vite-imagetools imports ending in &as=url resolve to asset URLs.
declare module "*&as=url" {
  const url: string
  export default url
}

interface ViteTypeOptions {
  strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly VITE_NHOST_SUBDOMAIN?: string
  readonly VITE_NHOST_REGION?: string
  readonly REACT_APP_NHOST_SUBDOMAIN?: string
  readonly REACT_APP_NHOST_REGION?: string
}
