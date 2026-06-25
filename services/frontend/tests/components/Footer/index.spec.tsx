import { test, expect } from '@playwright/experimental-ct-react'
import { Footer } from '@/components/Footer/index'

test('should work', async ({ mount }) => {
  const component = await mount(<Footer />)
  await expect(component).toContainText('Oodikone')
  await expect(component).toContainText('Build')
  await expect(component).toContainText('Version dev')
})
