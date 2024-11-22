import { useEffect, useState } from 'react'
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
    const defaultCurriculum = curriculums.find(
      curriculum => new Date(curriculum.valid_from) <= new Date(`${startYear}-08-01`)
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

  if (curriculums.length === 0) return null

  return (
    <Dropdown
      className="link item"
      data-cy="curriculum-picker"
      disabled={disabled}
      onChange={(_, { value }) => setSelectedCurriculum(curriculums.find(curriculum => curriculum.id === value))}
      options={curriculums.map(curriculum => ({
        key: curriculum.curriculum_period_ids.toSorted().join(', '),
        value: curriculum.id,
        text: curriculum.curriculumName,
      }))}
      style={{
        background: '#e3e3e3',
        marginLeft: '10px',
        padding: '4px 4px 4px 8px',
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
