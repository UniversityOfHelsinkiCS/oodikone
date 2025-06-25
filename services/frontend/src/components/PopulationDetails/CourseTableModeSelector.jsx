import { Form, Input, Radio } from 'semantic-ui-react'

import { CurriculumPicker } from '@/components/material/CurriculumPicker'

export const CourseTableModeSelector = ({
  courseTableMode,
  onStudentAmountLimitChange,
  setCourseTableMode,
  curriculum,
  curriculumList,
  setCurriculum,
  studentAmountLimit,
}) => {
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
          curriculum={curriculum}
          curriculumList={curriculumList}
          disabled={courseTableMode !== 'curriculum'}
          setCurriculum={setCurriculum}
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
