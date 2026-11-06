import { test, expect } from '@playwright/experimental-ct-react'

import { PanelViewWrapper } from './PanelViewWrapper'

type WindowWithCopiedText = Window & { copiedText?: string }

const mockClipboard = () => {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: (text: string) => {
        ;(window as WindowWithCopiedText).copiedText = text
        return Promise.resolve()
      },
    },
  })
}

test('panels get ids from their title or anchorId and start collapsed', async ({ mount, page }) => {
  await mount(<PanelViewWrapper />)

  await expect(page.locator('#credit-statistics')).toBeVisible()
  await expect(page.locator('#students')).toBeVisible()
  await expect(page.getByText(/Credit statistics content/)).toHaveCount(0)
  await expect(page.getByText('Students content')).toHaveCount(0)
})

test('copy link button copies a panel link without toggling the panel', async ({ mount, page }) => {
  await mount(<PanelViewWrapper />)
  await page.evaluate(mockClipboard)

  await page.locator('[data-cy="students-copy-link-button"]').click()

  await expect(page.getByText('Copied link to panel')).toBeVisible()
  const copied = await page.evaluate(() => (window as WindowWithCopiedText).copiedText ?? '')
  expect(new URL(copied).searchParams.get('view')).toBe('students')
  await expect(page.getByText('Students content')).toHaveCount(0)
})

test('panel linked with the view query param starts expanded', async ({ mount, page }) => {
  await page.evaluate(() => window.history.replaceState(null, '', '?view=students'))
  await mount(<PanelViewWrapper />)

  await expect(page.getByText('Students content')).toBeVisible()
  await expect(page.getByText(/Credit statistics content/)).toHaveCount(0)
})

test('the page scrolls to the linked panel', async ({ mount, page }) => {
  await page.evaluate(() => window.history.replaceState(null, '', '?view=students'))
  await mount(<PanelViewWrapper tall />)

  await expect(page.getByText('Students content')).toBeVisible()
  await expect.poll(async () => (await page.locator('#students').boundingBox())?.y ?? Infinity).toBeLessThan(5)
})

test('clicking the empty space at the right of the header toggles the panel', async ({ mount, page }) => {
  await mount(<PanelViewWrapper />)

  const header = page.locator('#students .MuiAccordion-heading')
  const box = await header.boundingBox()
  if (!box) throw new Error('Panel header is not visible')

  // The link button sits right after the title, not at the far edge of the header
  const titleBox = await page.locator('[data-cy="Students (12)"]').boundingBox()
  const linkBox = await page.locator('[data-cy="students-copy-link-button"]').boundingBox()
  if (!titleBox || !linkBox) throw new Error('Title or link button is not visible')
  expect(linkBox.x - (titleBox.x + titleBox.width)).toBeLessThan(40)

  await header.click({ position: { x: box.width - 10, y: box.height / 2 } })
  await expect(page.getByText('Students content')).toBeVisible()

  await header.click({ position: { x: box.width - 10, y: box.height / 2 } })
  await expect(page.getByText('Students content')).toHaveCount(0)
})

test('the copy link button is outside the panel heading', async ({ mount, page }) => {
  await mount(<PanelViewWrapper />)

  await expect(page.locator('#students h3')).toHaveText('Students (12)')
  await expect(page.locator('#students h3 [data-cy="students-copy-link-button"]')).toHaveCount(0)
  await expect(page.locator('#students [data-cy="students-copy-link-button"]')).toBeVisible()
})

test('view link opens the linked panel on the linked tab', async ({ mount, page }) => {
  await page.evaluate(() => window.history.replaceState(null, '', '?view=credit-statistics.second'))
  await mount(<PanelViewWrapper />)

  await expect(page.getByText('Credit statistics content, tab 1')).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Second tab' })).toHaveAttribute('aria-selected', 'true')
})

test('panel links include only the current tab of that panel', async ({ mount, page }) => {
  await page.evaluate(() => window.history.replaceState(null, '', '?years=2020&view=credit-statistics'))
  await mount(<PanelViewWrapper />)
  await page.evaluate(mockClipboard)
  const copiedLink = async () => new URL(await page.evaluate(() => (window as WindowWithCopiedText).copiedText ?? ''))

  await page.getByRole('tab', { name: 'Second tab' }).click()
  await expect(page.getByText('Credit statistics content, tab 1')).toBeVisible()
  await expect.poll(() => new URL(page.url()).searchParams.has('view')).toBe(false)
  expect(new URL(page.url()).searchParams.get('years')).toBe('2020')

  await page.locator('[data-cy="credit-statistics-copy-link-button"]').click()
  expect((await copiedLink()).searchParams.get('view')).toBe('credit-statistics.second')

  await page.locator('[data-cy="students-copy-link-button"]').click()
  const otherLink = await copiedLink()
  expect(otherLink.searchParams.get('view')).toBe('students')
  expect(otherLink.searchParams.get('years')).toBe('2020')
})

test('the view link is dropped after toggling a panel, so reopening it does not apply the link again', async ({
  mount,
  page,
}) => {
  await page.evaluate(() => window.history.replaceState(null, '', '?view=credit-statistics.second'))
  await mount(<PanelViewWrapper />)
  await expect(page.getByRole('tab', { name: 'Second tab' })).toHaveAttribute('aria-selected', 'true')

  await page.getByText('Credit statistics', { exact: true }).click()
  await expect(page.getByText(/Credit statistics content/)).toHaveCount(0)
  await expect.poll(() => new URL(page.url()).searchParams.has('view')).toBe(false)

  await page.getByText('Credit statistics', { exact: true }).click()
  await expect(page.getByRole('tab', { name: 'First tab' })).toHaveAttribute('aria-selected', 'true')
})

test('copy link shows an error when the clipboard is not available', async ({ mount, page }) => {
  await mount(<PanelViewWrapper />)
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('Denied')) },
    })
  )

  await page.locator('[data-cy="students-copy-link-button"]').click()
  await expect(page.getByText('Could not copy the link to the panel')).toBeVisible()
})

test('panels without links have no copy link buttons and ignore the view param', async ({ mount, page }) => {
  await page.evaluate(() => window.history.replaceState(null, '', '?view=students'))
  await mount(<PanelViewWrapper linkable={false} />)

  await expect(page.locator('#students')).toBeVisible()
  await expect(page.getByRole('button', { name: /Copy link/ })).toHaveCount(0)
  await expect(page.getByText('Students content')).toHaveCount(0)

  await page.getByText('Students (12)').click()
  await expect(page.getByText('Students content')).toBeVisible()
  await page.getByText('Students (12)').click()
  await expect(page.getByText('Students content')).toHaveCount(0)
})
