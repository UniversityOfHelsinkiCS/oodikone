import React, { useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { flatten } from 'lodash'
import YearAccordion from './YearAccordion'

const PresentStudents = () => {
  const { data: presentStudents } = useSelector(state => state.presentStudents)
  const [activeYearAccordion, setActiveYearAccordion] = useState(-1)

  const mergeDataByYears = () => {
    if (!presentStudents) return {}
    const MERGE_TRESHOLD_AFTER_2000 = 5
    const entries = Object.entries(presentStudents)
      .map(e => [Number(e[0]), e[1]])
      .sort((a, b) => a[0] - b[0])

    let minYear = entries[0] ? entries[0][0] : -1
    let nextDecade = Math.ceil(minYear / 10) * 10
    let studentAccumulator = []
    let currentClusterSize = 1

    const mergedData = {}
    entries.forEach(([year, students], i) => {
      studentAccumulator.push(students)
      if (
        (currentClusterSize++ % Math.max(2, MERGE_TRESHOLD_AFTER_2000) === 0 && year >= 2000) ||
        (year + 1 === nextDecade && year < 2000) ||
        i === entries.length - 1
      ) {
        mergedData[`${minYear}-${year}`] = flatten([...studentAccumulator])
        studentAccumulator = []
        minYear = year + 1
        nextDecade = Math.ceil((minYear + 1) / 10) * 10
        currentClusterSize = 1
      }
    })
    return mergedData
  }

  const mergedData = useMemo(() => mergeDataByYears(), [presentStudents])
  return (
    <div>
      <h2 style={{ margin: '10px' }}>
        Behind a feature toggle (this page is only visible to admins and developers and is still under development)
      </h2>
      {Object.entries(mergedData)
        .slice()
        .reverse()
        .map(([years, students], i) => (
          <YearAccordion
            index={i}
            active={activeYearAccordion === i}
            handleClick={() => setActiveYearAccordion(i === activeYearAccordion ? -1 : i)}
            key={`${years}-${students.length}`}
            years={years}
            students={students}
          />
        ))}
    </div>
  )
}

export default PresentStudents
