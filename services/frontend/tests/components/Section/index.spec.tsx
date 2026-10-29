import { test, expect } from '@playwright/experimental-ct-react'

import { SectionWrapper } from './SectionWrapper'

type WindowWithCopiedText = Window & { copiedText?: string }

test('titled section gets an id and a copy link button', async ({ mount, page }) => {
  await mount(<SectionWrapper title="Master students" />)
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: (text: string) => {
          ;(window as WindowWithCopiedText).copiedText = text
          return Promise.resolve()
        },
      },
    })
  })

  await expect(page.locator('[data-cy="test-section"]')).toHaveAttribute('id', 'master-students')
  await page.getByRole('button', { name: 'Copy link to this section' }).click()

  await expect(page.getByText('Copied link to section')).toBeVisible()
  const copied = await page.evaluate(() => (window as WindowWithCopiedText).copiedText ?? '')
  expect(new URL(copied).searchParams.get('section')).toBe('master-students')
})

test('untitled section has no copy link button', async ({ mount, page }) => {
  await mount(<SectionWrapper />)

  await expect(page.getByText('Content')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Copy link to this section' })).toHaveCount(0)
})
