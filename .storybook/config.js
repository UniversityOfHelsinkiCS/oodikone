import { configure } from '@storybook/react'

function loadStories() {
  console.log('asasd')
  require('../src/components/AccessDenied/index.storybook')
  // You can require as many stories as you need.
}

configure(loadStories, module);