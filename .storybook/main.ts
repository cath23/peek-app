import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: [
    '../src/stories/**/*.mdx',
    '../src/**/*.stories.@(ts|tsx)',
  ],
  addons: ['@storybook/addon-docs'],
  viteFinal: (viteConfig) => {
    // Stories must be deterministic: blank out the Convex deployment URL so
    // the data seam takes its static-mock path (hasConvex = false) instead of
    // subscribing to live queries that never resolve without an authed
    // session (which left the page stories on permanent skeletons).
    viteConfig.define = {
      ...viteConfig.define,
      'import.meta.env.VITE_CONVEX_URL': JSON.stringify(''),
    }
    return viteConfig
  },
}

export default config
