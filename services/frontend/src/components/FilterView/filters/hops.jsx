import React from 'react'
import { Radio, Button, Form } from 'semantic-ui-react'
import { useFilters } from 'components/FilterView/useFilters'
import moment from 'moment'
import { createFilter } from './createFilter'
import { creditDateFilter } from './date'

const getCutStudyStart = ({ options, filterDispatch }) => {
  return (
    <Button
      content="Cut credits to study start"
      onClick={() =>
        filterDispatch(
          creditDateFilter.actions.setOptions({
            startDate: moment(options.studyStart),
            endDate: null,
          })
        )
      }
      disabled={!options.activeProgramme && !options.activeCombinedProgramme}
      className="credit-date-filter-input"
      size="mini"
      primary
      style={{
        margin: '0.5rem',
        whiteSpace: 'nowrap',
      }}
    />
  )
}

const HopsFilterCard = ({ options, onOptionsChange, combinedProgramme }) => {
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
              label="None"
              name="radioGroup"
              checked={
                !options.activeProgramme ||
                (options.activeProgramme === false && options.activeCombinedProgramme === false)
              }
              onChange={() =>
                onOptionsChange({
                  ...options,
                  activeProgramme: false,
                  activeCombinedProgramme: false,
                  combinedIsSelected: 'default',
                })
              }
              data-cy="option-hops-bachelor"
              style={{ margin: '0.5rem 0' }}
            />
            <Radio
              label="Bachelor studyright"
              name="radioGroup"
              checked={options.activeProgramme === true && options.activeCombinedProgramme === false}
              onChange={() =>
                onOptionsChange({
                  ...options,
                  activeProgramme: true,
                  activeCombinedProgramme: false,
                  combinedIsSelected: 'default',
                })
              }
              data-cy="option-hops-bachelor"
              style={{ margin: '0.5rem 0' }}
            />
            <Radio
              label={`${typeOfCombined} studyright`}
              name="radioGroup"
              checked={options.activeProgramme === false && options.activeCombinedProgramme === true}
              onChange={() =>
                onOptionsChange({
                  ...options,
                  activeProgramme: false,
                  activeCombinedProgramme: true,
                  combinedIsSelected: combinedProgramme,
                })
              }
              data-cy="option-hops-combined"
              style={{ margin: '0.5rem 0' }}
            />
            <Radio
              label="Both studyrights"
              name="radioGroup"
              checked={options.activeProgramme === true && options.activeCombinedProgramme === true}
              onChange={() =>
                onOptionsChange({
                  ...options,
                  activeProgramme: true,
                  activeCombinedProgramme: true,
                  combinedIsSelected: combinedProgramme,
                })
              }
              data-cy="option-hops-both"
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
        style={{ display: 'flex', alignItems: 'center', gap: '1em', cursor: 'pointer' }}
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
      >
        <Radio style={{ width: '3.5rem', flexShrink: 0 }} toggle checked={options.activeProgramme} />
        <div>Show only credits included in study plan</div>
      </div>
      {options.studyStart ? getCutStudyStart({ options, filterDispatch }) : null}
    </div>
  )
}

export const hopsFilter = createFilter({
  key: 'hops',

  title: 'Personal Study Plan',

  priority: -200,

  defaultOptions: {
    activeProgramme: false,
    activeCombinedProgramme: false,
    combinedIsSelected: 'default',
  },

  precompute: ({ args }) => {
    return args.combinedProgrammeCode
  },

  isActive: arg => arg?.activeProgramme || arg?.activeCombinedProgramme,

  filter: (student, { activeProgramme, activeCombinedProgramme }, { args }) => {
    const { studyrightStart, studyplans } = student
    const studyrightStartDate = new Date(studyrightStart)
    const studyrights = student.studyrights.filter(sr => !sr.cancelled)?.map(sr => sr.studyrightid)

    const hops = studyplans.find(
      plan => plan.programme_code === args.programmeCode && studyrights.includes(plan.studyrightid)
    )
    const secondHops = args.combinedProgrammeCode
      ? studyplans.find(
          plan => plan.programme_code === args.combinedProgrammeCode && studyrights.includes(plan.studyrightid)
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
        course => courses.has(course.course_code) || secondProgrammeCourses.has(course.course_code)
      )
      student.courses = [...new Set(hopsCourses)]
      return true
    }
    const courses = student.courses.filter(({ date }) => new Date(date) >= studyrightStartDate)
    student.courses = courses
    return true
  },

  selectors: {
    isCombinedSelected: ({ combinedIsSelected }, code) => {
      return combinedIsSelected === code
    },
    isBothSelected: ({ combinedIsSelected, activeProgramme }, code) => {
      return combinedIsSelected === code && activeProgramme
    },
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
      options.combinedIsSelected = combinedProgrammeCode
    },
  },

  component: HopsFilterCard,

  render: (props, { precomputed }) => <HopsFilterCard {...props} combinedProgramme={precomputed} />,
})
