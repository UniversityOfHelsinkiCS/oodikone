import { Dropdown, Form, Input, Radio } from 'semantic-ui-react'
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

export const CurriculumPicker = ({ setCurriculum, programmeCodes, disabled, year }) => {
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
      data-cy="curriculum-picker"
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

export const CourseTableModeSelector = ({
  courseTableMode,
  setCourseTableMode,
  year,
  studyProgramme,
  setCurriculum,
  studentAmountLimit,
  setStudentAmountLimit,
  filteredStudents,
  onStudentAmountLimitChange,
}) => {
  useEffect(() => {
    setStudentAmountLimit(Math.round(filteredStudents.length ? filteredStudents.length * 0.3 : 0))
  }, [filteredStudents.length])

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
        <Radio
          style={{ fontWeight: 'bold' }}
          label="Choose curriculum"
          name="coursesRadioGroup"
          value="curriculum"
          onChange={(event, { value }) => setCourseTableMode(value)}
          checked={courseTableMode === 'curriculum'}
        />
        <Radio
          style={{ fontWeight: 'bold' }}
          label="Show all courses with at least"
          name="coursesRadioGroup"
          value="all"
          onChange={(event, { value }) => setCourseTableMode(value)}
          checked={courseTableMode === 'all'}
        />
      </div>
      <div>
        <CurriculumPicker
          year={year}
          programmeCodes={[studyProgramme]}
          setCurriculum={setCurriculum}
          disabled={courseTableMode !== 'curriculum'}
        />
        <Form style={{ padding: '4px 4px 4px 8px' }}>
          <Form.Field inline>
            <Input
              value={studentAmountLimit}
              onChange={e => onStudentAmountLimitChange(e.target.value)}
              disabled={courseTableMode !== 'all'}
              style={{ width: '70px' }}
            />
            <label>total students</label>
          </Form.Field>
        </Form>
      </div>
    </div>
  )
}
