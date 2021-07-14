import React, { useState, useMemo } from 'react'
import { Loader } from 'semantic-ui-react'
import { useSelector } from 'react-redux'
import { flatten } from 'lodash'
import YearAccordion from './YearAccordion'

const PresentStudents = () => {
  const { data: presentStudents, pending } = useSelector(state => state.presentStudents)
  const [activeYearAccordion, setActiveYearAccordion] = useState(-1)

  // Tries to merge data by years in the following manner:
  // ..., 80-89, 90-99, 00-04, 04-09
  // There may be some differences in results if some years
  // have 0 students or MERGE_TRESHOLD_AFTER_2000 is changed.
  const mergeDataByYears = () => {
    if (!presentStudents) return {}
    const MERGE_TRESHOLD_AFTER_2000 = 5
    const entries = Object.entries(presentStudents)
      .map(e => [Number(e[0]), e[1]])
      .sort((a, b) => a[0] - b[0])

    const getNextDecadeFrom = year => Math.ceil((year % 10 === 0 ? year + 1 : year) / 10) * 10

    const mergedData = {}
    let minYear
    let maxYear
    let nextDecade
    let studentAccumulator
    let currentClusterSize

    const resetVariablesTo = (year, csize = 1) => {
      studentAccumulator = []
      minYear = year
      maxYear = minYear
      nextDecade = getNextDecadeFrom(minYear)
      currentClusterSize = csize
    }

    resetVariablesTo(entries[0] ? entries[0][0] : -1, 0)

    const mergeData = year => {
      mergedData[minYear !== maxYear ? `${minYear}-${maxYear}` : `${maxYear}`] = {
        endYear: year,
        students: flatten([...studentAccumulator]),
      }
      resetVariablesTo(year)
    }

    entries.forEach(([year, students], i) => {
      if (
        (currentClusterSize % Math.max(2, MERGE_TRESHOLD_AFTER_2000) === 0 &&
          maxYear >= 2000 &&
          currentClusterSize !== 0) ||
        (year >= nextDecade && maxYear < 2000)
      ) {
        mergeData(year)
      } else {
        currentClusterSize++
        maxYear = year
      }
      studentAccumulator.push(students)
      if (i === entries.length - 1) mergeData(year)
    })

    if (entries.length > 0) {
      mergedData.Total = {
        endYear: -Infinity,
        students: entries.reduce((acc, [, students]) => acc.concat(...students), []),
        bold: true,
      }
    }

    return mergedData
  }

  const mergedData = useMemo(() => Object.entries(mergeDataByYears()), [presentStudents])
  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Loader inline active={pending} />
      </div>
      {mergedData.length === 0 && !pending && <p>No present students</p>}
      {mergedData.length > 0 &&
        mergedData
          .slice()
          .sort(([, { endYear: endYear1 }], [, { endYear: endYear2 }]) => endYear2 - endYear1)
          .map(([years, { students, bold }], i) => (
            <YearAccordion
              bold={bold}
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
