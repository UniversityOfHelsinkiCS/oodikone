import { assert, describe, it } from 'vitest'

import { buildViewUrl, parseViewPath } from '@/components/common/viewPath'

describe('parseViewPath', () => {
  it('returns an empty path for a missing or empty value', () => {
    assert.deepEqual(parseViewPath(undefined), [])
    assert.deepEqual(parseViewPath(''), [])
  })

  it('splits the panel and its inner tab', () => {
    assert.deepEqual(parseViewPath('age-distribution'), ['age-distribution'])
    assert.deepEqual(parseViewPath('credit-statistics.distribution-development'), [
      'credit-statistics',
      'distribution-development',
    ])
  })

  it('ignores stray dots', () => {
    assert.deepEqual(parseViewPath('.students..modules.'), ['students', 'modules'])
  })
})

describe('buildViewUrl', () => {
  it('sets the view param to the joined path', () => {
    assert.equal(
      buildViewUrl('http://localhost:3000/populations?view=credit-statistics&years=2020', ['students', 'modules']),
      'http://localhost:3000/populations?view=students.modules&years=2020'
    )
  })
})
