import dayjs from 'dayjs'
import { Radio, Button, Form } from 'semantic-ui-react'

import { useFilters } from '@/components/FilterView/useFilters'
import { FilterTrayProps } from '../FilterTray'
import { createFilter } from './createFilter'
import { creditDateFilter } from './date'

const getCutStudyStart = ({ options, filterDispatch }) => {
  return (
    <Button
      content="Cut credits to study start"
      disabled={!options.activeProgramme && !options.activeCombinedProgramme}
      onClick={() =>
        filterDispatch(
          creditDateFilter.actions.setOptions({
            startDate: dayjs(options.studyStart),
            endDate: null,
          })
        )
      }
      primary
      size="mini"
      style={{
        margin: '0.5rem',
        whiteSpace: 'nowrap',
      }}
    />
  )
}

const HopsFilterCard = ({ options, onOptionsChange, precomputed: combinedProgramme }: FilterTrayProps) => {
  const { selectedStartDate } = creditDateFilter.selectors
  const { filterDispatch, useFilterSelector } = useFilters()
  const selectedCreditStartDate = useFilterSelector(selectedStartDate(''))

  if (combinedProgramme) {
    // For combined programme, we show radiobuttons due to many possible options
    const typeOfCombined = combinedProgramme === 'MH90_001' ? 'Licentiate' : 'Master'
    return (
      <Form>
        <div className="card-content">
          <Form.Field style={{ display: 'flex', flexDirection: 'column' }}>
            <Radio
              checked={
                !options.activeProgramme ||
                (options.activeProgramme === false && options.activeCombinedProgramme === false)
              }
              data-cy="option-hops-bachelor"
              label="None"
              name="radioGroup"
              onChange={() =>
                onOptionsChange({
                  ...options,
                  activeProgramme: false,
                  activeCombinedProgramme: false,
                  combinedIsSelected: 'default',
                })
              }
              style={{ margin: '0.5rem 0' }}
            />
            <Radio
              checked={options.activeProgramme === true && options.activeCombinedProgramme === false}
              data-cy="option-hops-bachelor"
              label="Bachelor studyright"
              name="radioGroup"
              onChange={() =>
                onOptionsChange({
                  ...options,
                  activeProgramme: true,
                  activeCombinedProgramme: false,
                  combinedIsSelected: 'default',
                })
              }
              style={{ margin: '0.5rem 0' }}
            />
            <Radio
              checked={options.activeProgramme === false && options.activeCombinedProgramme === true}
              data-cy="option-hops-combined"
              label={`${typeOfCombined} studyright`}
              name="radioGroup"
              onChange={() =>
                onOptionsChange({
                  ...options,
                  activeProgramme: false,
                  activeCombinedProgramme: true,
                  combinedIsSelected: combinedProgramme,
                })
              }
              style={{ margin: '0.5rem 0' }}
            />
            <Radio
              checked={options.activeProgramme === true && options.activeCombinedProgramme === true}
              data-cy="option-hops-both"
              label="Both studyrights"
              name="radioGroup"
              onChange={() =>
                onOptionsChange({
                  ...options,
                  activeProgramme: true,
                  activeCombinedProgramme: true,
                  combinedIsSelected: combinedProgramme,
                })
              }
              style={{ margin: '0.5rem 0' }}
            />
            {options.studyStart ? getCutStudyStart({ options, filterDispatch }) : null}
          </Form.Field>
        </div>
      </Form>
    )
  }

  // For a single programme
  return (
    <div>
      <div
        onClick={() => {
          if (
            selectedCreditStartDate &&
            options.studyStart &&
            options.clearCreditDate &&
            new Date(selectedCreditStartDate) > new Date(options.studyStart) &&
            !options.activeProgramme
          )
            filterDispatch(
              creditDateFilter.actions.setOptions({
                startDate: null,
                endDate: null,
              })
            )
          onOptionsChange({
            ...options,
            activeProgramme: !options.activeProgramme,
            combinedIsSelected: 'default',
          })
        }}
        style={{ display: 'flex', alignItems: 'center', gap: '1em', cursor: 'pointer' }}
      >
        <Radio checked={options.activeProgramme} style={{ width: '3.5rem', flexShrink: 0 }} toggle />
        <div>Show only credits included in study plan</div>
      </div>
      {options.studyStart ? getCutStudyStart({ options, filterDispatch }) : null}
    </div>
  )
}

export const hopsFilter = createFilter({
  key: 'hops',

  title: 'Personal study plan',

  defaultOptions: {
    activeProgramme: false,
    activeCombinedProgramme: false,
    combinedIsSelected: 'default',
  },

  precompute: ({ args }) => {
    return args.combinedProgrammeCode
  },

  isActive: arg => !!arg?.activeProgramme || !!arg?.activeCombinedProgramme,

  filter: (student, { args, options }) => {
    const { activeProgramme, activeCombinedProgramme } = options

    const studyRights = student.studyRights.filter(({ cancelled }) => !cancelled).map(({ id }) => id)
    const hops = student.studyplans.find(
      ({ programme_code, sis_study_right_id }) =>
        programme_code === args.programmeCode && studyRights.includes(sis_study_right_id)
    )
    const secondHops = args.combinedProgrammeCode
      ? student.studyplans.find(
          plan => plan.programme_code === args.combinedProgrammeCode && studyRights.includes(plan.sis_study_right_id)
        )
      : null

    if (activeProgramme || activeCombinedProgramme) {
      if (!hops && !secondHops) {
        student.courses = []
        return true
      }
      const courses = new Set(hops && activeProgramme ? hops.included_courses : [])
      const secondProgrammeCourses = new Set(secondHops && activeCombinedProgramme ? secondHops.included_courses : [])
      const hopsCourses = student.courses.filter(
        ({ course_code }) => courses.has(course_code) || secondProgrammeCourses.has(course_code)
      )
      student.courses = [...new Set(hopsCourses)]
      return true
    }

    return true
  },

  selectors: {
    isPrimarySelected: ({ activeProgramme }) => !!activeProgramme,
    isCombinedSelected: ({ combinedIsSelected }, code) => combinedIsSelected === code,
    isBothSelected: ({ combinedIsSelected, activeProgramme }, code) => combinedIsSelected === code && activeProgramme,
  },

  actions: {
    toggle: options => {
      options.activeProgramme = !options.activeProgramme
      options.activeCombinedProgramme = false
      options.combinedIsSelected = 'default'
    },
    toggleCombinedProgramme: (options, combinedProgrammeCode) => {
      options.activeProgramme = false
      options.activeCombinedProgramme = !options.activeCombinedProgramme
      options.combinedIsSelected =
        options.combinedIsSelected === combinedProgrammeCode ? 'default' : combinedProgrammeCode
    },
  },

  render: HopsFilterCard,
})
