import React from 'react'
import { Radio, Button } from 'semantic-ui-react'
import useFilters from 'components/FilterView/useFilters'
import moment from 'moment'
import createFilter from './createFilter'
import creditDateFilter, { selectedStartDate } from './date'

const HopsFilterCard = ({ options, onOptionsChange, combinedProgramme }) => {
  const { filterDispatch, useFilterSelector } = useFilters()
  const selectedCreditStartDate = useFilterSelector(selectedStartDate(''))
  const typeOfCombined = combinedProgramme === 'MH90_001' ? 'Licentiate' : 'Master'
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
            activeCombinedProgramme: false,
            combinedIsSelected: 'default',
          })
        }}
      >
        <Radio style={{ width: '3.5rem', flexShrink: 0 }} toggle checked={options.activeProgramme} />
        {combinedProgramme ? (
          <div>Show only credits included in Bachelor study plan</div>
        ) : (
          <div>Show only credits included in study plan</div>
        )}
      </div>
      {combinedProgramme && (
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '1em', cursor: 'pointer' }}
          onClick={() => {
            if (
              selectedCreditStartDate &&
              options.studyStart &&
              options.clearCreditDate &&
              new Date(selectedCreditStartDate) > new Date(options.studyStart) &&
              !options.activeCombinedProgramme
            )
              filterDispatch(
                creditDateFilter.actions.setOptions({
                  startDate: null,
                  endDate: null,
                })
              )
            onOptionsChange({
              ...options,
              activeCombinedProgramme: !options.activeCombinedProgramme,
              activeProgramme: false,
              combinedIsSelected: combinedProgramme,
            })
          }}
        >
          <Radio style={{ width: '3.5rem', flexShrink: 0 }} toggle checked={options.activeCombinedProgramme} />
          <div>Show only credits included in {typeOfCombined} study plan</div>
        </div>
      )}
      {options.studyStart ? (
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
          style={{
            margin: '0.5rem',
            whiteSpace: 'nowrap',
          }}
        />
      ) : null}
    </div>
  )
}

export default createFilter({
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
    const chosenProgrammeCode = activeCombinedProgramme ? args.combinedProgrammeCode : args.programmeCode
    const hops = studyplans.find(
      plan => plan.programme_code === chosenProgrammeCode && studyrights.includes(plan.studyrightid)
    )

    if (activeProgramme || activeCombinedProgramme) {
      if (!hops) {
        student.courses = []
        student.credits = 0
        return true
      }
      const courses = new Set(hops ? hops.included_courses : [])
      const hopsCourses = student.courses.filter(course => courses.has(course.course_code))
      student.courses = hopsCourses
      student.credits = hops.completed_credits
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
