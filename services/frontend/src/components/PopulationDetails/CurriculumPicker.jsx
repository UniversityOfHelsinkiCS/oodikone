import { Dropdown } from 'semantic-ui-react'
import React, { useState, useEffect } from 'react'
import { curriculumsApi } from 'redux/populationCourses'
import { sortBy } from 'lodash'

const { useGetCurriculumsQuery, useGetCurriculumOptionsQuery } = curriculumsApi

const chooseCurriculumToFetch = (curriculums, selectedCurriculum, startYear) => {
  if (selectedCurriculum?.curriculum_period_ids) {
    return selectedCurriculum
  }
  if (curriculums.length > 0) {
    if (!startYear) {
      return curriculums[0]
    }
    const defaultCurriculum = curriculums.find(cur => cur.curriculum_period_ids.includes(parseInt(startYear, 10)))
    return defaultCurriculum ?? curriculums[0]
  }
  return null
}

const CurriculumPicker = ({ setCurriculum, programmeCodes, disabled, year }) => {
  const curriculumOptionsQuery = useGetCurriculumOptionsQuery({ code: programmeCodes[0] }, { skip: !programmeCodes[0] })
  const curriculums = curriculumOptionsQuery.data ?? []
  const [selectedCurriculum, setSelectedCurriculum] = useState(null)
  const chosenCurriculum = chooseCurriculumToFetch(curriculums, selectedCurriculum, year)
  const curriculumsQuery = useGetCurriculumsQuery(
    {
      code: programmeCodes[0],
      period_ids: chosenCurriculum?.curriculum_period_ids,
    },
    { skip: !chosenCurriculum?.curriculum_period_ids }
  )

  useEffect(() => {
    curriculumsQuery.refetch()
  }, [selectedCurriculum])

  useEffect(() => {
    if (!curriculumsQuery.data) {
      setCurriculum(null)
      return
    }
    setCurriculum({ ...curriculumsQuery.data, version: chosenCurriculum?.curriculum_period_ids })
  }, [curriculumsQuery.data])

  const formatCurriculumOptions = cur => {
    const years = sortBy(cur.curriculum_period_ids)
    if (years.length === 0) return 'error'
    if (years.length === 1) return years[0]
    return `${years[0]} - ${years[years.length - 1]}`
  }

  return (
    <Dropdown
      disabled={disabled}
      style={{
        padding: '4px',
        paddingLeft: '8px',
        marginLeft: '10px',
        background: '#e3e3e3',
      }}
      className="link item"
      value={chosenCurriculum}
      onChange={(_, { value }) => setSelectedCurriculum(value)}
      options={sortBy(
        curriculums.map(cur => ({
          key: sortBy(cur.curriculum_period_ids).join(', '),
          value: cur,
          text: formatCurriculumOptions(cur),
        })),
        'key'
      )}
    />
  )
}

export default CurriculumPicker
