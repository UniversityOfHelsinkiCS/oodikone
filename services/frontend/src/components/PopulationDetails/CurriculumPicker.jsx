import { sortBy } from 'lodash'
import React, { useEffect, useState } from 'react'
import { Dropdown, Form, Input, Radio } from 'semantic-ui-react'

import { useGetCurriculumsQuery, useGetCurriculumOptionsQuery } from '@/redux/populationCourses'

const chooseCurriculumToFetch = (curriculums, selectedCurriculum, startYear) => {
  if (selectedCurriculum?.curriculum_period_ids) {
    return selectedCurriculum
  }
  if (curriculums.length > 0) {
    if (!startYear) {
      return curriculums[0]
    }
    const defaultCurriculum = curriculums.find(curriculum =>
      curriculum.curriculum_period_ids.includes(parseInt(startYear, 10))
    )
    return defaultCurriculum ?? curriculums[0]
  }
  return null
}

export const CurriculumPicker = ({ setCurriculum, programmeCodes, disabled, year }) => {
  const { data: curriculums = [] } = useGetCurriculumOptionsQuery(
    { code: programmeCodes[0] },
    { skip: !programmeCodes[0] }
  )
  const [selectedCurriculum, setSelectedCurriculum] = useState(null)
  const chosenCurriculum = chooseCurriculumToFetch(curriculums, selectedCurriculum, year)
  const { data: chosenCurriculumData } = useGetCurriculumsQuery(
    {
      code: programmeCodes[0],
      periodIds: chosenCurriculum?.curriculum_period_ids,
    },
    { skip: !chosenCurriculum?.curriculum_period_ids }
  )

  useEffect(() => {
    if (!chosenCurriculumData) {
      setCurriculum(null)
      return
    }
    setCurriculum({ ...chosenCurriculumData, version: chosenCurriculum?.curriculum_period_ids })
  }, [chosenCurriculumData])

  const formatCurriculumOptions = curriculum => {
    const years = sortBy(curriculum.curriculum_period_ids)
    if (years.length === 0) return 'error'
    if (years.length === 1) return years[0]
    return `${years[0]} - ${years[0] + 3}`
  }

  if (curriculums.length === 0) return null

  return (
    <Dropdown
      className="link item"
      data-cy="curriculum-picker"
      disabled={disabled}
      onChange={(_, { value }) => setSelectedCurriculum(curriculums.find(curriculum => curriculum.id === value))}
      options={sortBy(
        curriculums.map(curriculum => ({
          key: sortBy(curriculum.curriculum_period_ids).join(', '),
          value: curriculum.id,
          text: formatCurriculumOptions(curriculum),
        })),
        'key'
      )}
      style={{
        padding: '4px',
        paddingLeft: '8px',
        marginLeft: '10px',
        background: '#e3e3e3',
      }}
      value={chosenCurriculum.id}
    />
  )
}

export const CourseTableModeSelector = ({
  courseTableMode,
  filteredStudents,
  onStudentAmountLimitChange,
  setCourseTableMode,
  setCurriculum,
  setStudentAmountLimit,
  studentAmountLimit,
  studyProgramme,
  year,
}) => {
  useEffect(() => {
    setStudentAmountLimit(Math.round(filteredStudents.length ? filteredStudents.length * 0.3 : 0))
  }, [filteredStudents.length])

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
        <Radio
          checked={courseTableMode === 'curriculum'}
          label="Choose curriculum"
          name="coursesRadioGroup"
          onChange={(_event, { value }) => setCourseTableMode(value)}
          style={{ fontWeight: 'bold' }}
          value="curriculum"
        />
        <Radio
          checked={courseTableMode === 'all'}
          label="Show all courses with at least"
          name="coursesRadioGroup"
          onChange={(_event, { value }) => setCourseTableMode(value)}
          style={{ fontWeight: 'bold' }}
          value="all"
        />
      </div>
      <div>
        <CurriculumPicker
          disabled={courseTableMode !== 'curriculum'}
          programmeCodes={[studyProgramme]}
          setCurriculum={setCurriculum}
          year={year}
        />
        <Form style={{ padding: '4px 4px 4px 8px' }}>
          <Form.Field inline>
            <Input
              disabled={courseTableMode !== 'all'}
              onChange={event => onStudentAmountLimitChange(event.target.value)}
              style={{ width: '70px' }}
              value={studentAmountLimit}
            />
            <label>total students</label>
          </Form.Field>
        </Form>
      </div>
    </div>
  )
}
