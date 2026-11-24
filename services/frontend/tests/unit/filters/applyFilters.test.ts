import dayjs from 'dayjs'
import { assert, describe, it } from 'vitest'

import { applyFilters } from '@/components/FilterView/applyFilters'
import { creditDateFilter, creditsEarnedFilter, genderFilter, hetuFilter } from '@/components/FilterView/filters'
import type { GenericFilter } from '@/components/FilterView/filters/createFilter'
import { precomputeFilters } from '@/components/FilterView/precompute'
import { GenderCode } from '@oodikone/shared/types'

import { createCourse, createStudent } from '@oodikone/shared/test/utils'

const run = (filters: GenericFilter[], students: ReturnType<typeof createStudent>[], options: Record<string, any>) => {
  const precomputed = precomputeFilters(filters, students)
  const getContextByKey = (key: string) => ({
    options: options[key] ?? filters.find(filter => filter.key === key)!.defaultOptions,
    args: filters.find(filter => filter.key === key)!.args,
    precomputed: precomputed[key],
  })

  return applyFilters(filters, students, getContextByKey).map(({ studentNumber }) => studentNumber)
}

const female = createStudent({ studentNumber: 'female', gender_code: GenderCode.FEMALE, hasPersonalIdentityCode: true })
const male = createStudent({ studentNumber: 'male', gender_code: GenderCode.MALE, hasPersonalIdentityCode: true })
const noHetu = createStudent({
  studentNumber: 'no-hetu',
  gender_code: GenderCode.FEMALE,
  hasPersonalIdentityCode: false,
})

void describe('applyFilters', () => {
  void it('should return every student when no filter is active', () => {
    assert.deepStrictEqual(run([genderFilter(), hetuFilter()], [female, male, noHetu], {}), [
      'female',
      'male',
      'no-hetu',
    ])
  })

  void it('should require a student to pass every active filter', () => {
    const options = {
      [genderFilter.key]: { selected: [Number(GenderCode.FEMALE)] },
      [hetuFilter.key]: { mode: 1 },
    }

    assert.deepStrictEqual(run([genderFilter(), hetuFilter()], [female, male, noHetu], options), ['female'])
  })

  void it('should skip filters that are not active', () => {
    const options = { [genderFilter.key]: { selected: [] } }

    assert.isFalse(
      genderFilter().filter(female, { options: { selected: [] }, args: undefined, precomputed: undefined })
    )
    assert.deepStrictEqual(run([genderFilter()], [female, male], options), ['female', 'male'])
  })

  void it('should pass students changed by a mutating filter on to the filters after it', () => {
    const student = createStudent({
      studentNumber: 'student',
      courses: [
        createCourse({ credits: 5, date: new Date('2024-06-01') }),
        createCourse({ credits: 20, date: new Date('2020-06-01') }),
      ],
    })
    const options = {
      [creditDateFilter.key]: { startDate: dayjs('2024-01-01'), endDate: dayjs('2024-12-31') },
      [creditsEarnedFilter.key]: { min: null, max: 10 },
    }

    assert.deepStrictEqual(run([creditDateFilter(), creditsEarnedFilter()], [student], options), ['student'])
    assert.deepStrictEqual(run([creditsEarnedFilter(), creditDateFilter()], [student], options), [])
  })
})
