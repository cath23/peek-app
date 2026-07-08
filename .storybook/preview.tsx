import type { Decorator, Preview } from '@storybook/react-vite'
import { useEffect } from 'react'
import '../src/index.css'

const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme ?? 'light'
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.body.classList.add('bg-bg-base', 'text-text-primary', 'font-sans')
  }, [theme])
  return <Story />
}

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Color theme',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },
  parameters: {
    layout: 'centered',
    controls: { expanded: true },
  },
  decorators: [withTheme],
}

export default preview
