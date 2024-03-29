import React, { useState } from 'react'
import { Divider, Dropdown, Form, Icon, Loader, Message } from 'semantic-ui-react'

import { reformatDate } from '@/common'
import { useTitle } from '@/common/hooks'
import { StudentInfoItem } from '@/components/common/StudentInfoItem'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SortableTable } from '@/components/SortableTable'
import { StudentNameVisibilityToggle, useStudentNameVisibility } from '@/components/StudentNameVisibilityToggle'
import { useGetStudentsCloseToGraduationQuery } from '@/redux/closeToGraduation'
import { useGetFacultiesQuery } from '@/redux/facultyStats'

const getColumns = (getTextIn, namesVisible) => [
  {
    key: 'studentNumber',
    title: 'Student number',
    getRowVal: row => row.student.studentNumber,
    getRowContent: row => <StudentInfoItem showSisuLink student={row.student} />,
    filterable: false,
  },
  {
    key: 'name',
    title: 'Name',
    getRowVal: row => row.student.name,
    filterable: false,
    displayColumn: namesVisible,
  },
  {
    key: 'programme',
    title: 'Programme',
    getRowVal: row => getTextIn(row.programme.name),
  },
  {
    key: 'startOfStudyright',
    title: 'Start of studyright',
    getRowVal: row => row.startOfStudyright,
    getRowContent: row => reformatDate(row.startOfStudyright, 'YYYY-MM-DD'),
    filterType: 'date',
  },
  {
    key: 'credits',
    title: 'Completed credits',
    children: [
      {
        key: 'hops',
        title: 'HOPS',
        getRowVal: row => row.credits.hops,
        filterType: 'range',
        forceToolsMode: 'floating',
      },
      {
        key: 'all',
        title: 'All',
        getRowVal: row => row.credits.all,
        filterType: 'range',
        forceToolsMode: 'floating',
      },
    ],
  },
  {
    key: 'thesisStatus',
    title: 'Thesis status',
    getRowVal: row => (row.thesisInfo ? 'Thesis written' : 'Thesis not written'),
    getRowContent: row => (row.thesisInfo ? <Icon color="green" name="check" /> : null),
    cellProps: row =>
      row.thesisInfo
        ? {
            style: { textAlign: 'center' },
            title: [
              `Attainment date: ${reformatDate(row.thesisInfo.attainmentDate, 'YYYY-MM-DD')}`,
              `Course code: ${row.thesisInfo.courseCode}`,
              `Grade: ${row.thesisInfo.grade}`,
            ].join('\n'),
          }
        : {},
  },
]

export const CloseToGraduation = () => {
  useTitle('Close to graduation')

  const { data: students, isError, isLoading } = useGetStudentsCloseToGraduationQuery()
  const { data: faculties = [] } = useGetFacultiesQuery()
  const { getTextIn } = useLanguage()
  const { visible: namesVisible } = useStudentNameVisibility()
  const [chosenFaculties, setChosenFaculties] = useState([])

  const renderContent = () => {
    if (isError) {
      return (
        <Message content="Please try reloading the page." header="There was an error" icon="ban" negative size="big" />
      )
    }

    if (isLoading) return <Loader active inline="centered" />

    return (
      <>
        <StudentNameVisibilityToggle style={{ marginBottom: '2em' }} />
        <Form style={{ width: '100%', marginBottom: '1em' }}>
          <Form.Field>
            <label>Choose faculties to filter by:</label>
            <Dropdown
              multiple
              onChange={(_, { value }) => setChosenFaculties([...value])}
              options={faculties.map(f => ({ key: f.code, text: getTextIn(f.name), value: f.code }))}
              placeholder="Faculty"
              selection
              value={chosenFaculties}
            />
          </Form.Field>
        </Form>
        <SortableTable
          columns={getColumns(getTextIn, namesVisible)}
          data={students.filter(
            s => chosenFaculties.length === 0 || chosenFaculties.includes(s.programme.code.slice(1, 4))
          )}
          featureName="students_close_to_graduation"
        />
      </>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Divider horizontal style={{ margin: '3em' }}>
        Students who are close to graduation
      </Divider>
      <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {renderContent()}
      </div>
    </div>
  )
}
