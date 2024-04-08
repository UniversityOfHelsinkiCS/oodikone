import React, { useState } from 'react'
import { Divider, Dropdown, Form, Icon, Loader, Message } from 'semantic-ui-react'

import { createLocaleComparator, reformatDate } from '@/common'
import { useTitle } from '@/common/hooks'
import { StudentInfoItem } from '@/components/common/StudentInfoItem'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SortableTable } from '@/components/SortableTable'
import { StudentNameVisibilityToggle, useStudentNameVisibility } from '@/components/StudentNameVisibilityToggle'
import { useGetStudentsCloseToGraduationQuery } from '@/redux/closeToGraduation'
import { useFilteredAndFormattedElementDetails } from '@/redux/elementdetails'
import { useGetFacultiesQuery } from '@/redux/facultyStats'

const getColumns = (getTextIn, namesVisible, studyTrackVisible) => [
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
    key: 'phoneNumber',
    title: 'Phone number',
    getRowVal: row => row.student.phoneNumber,
    displayColumn: false,
  },
  {
    key: 'email',
    title: 'Email',
    getRowVal: row => row.student.email,
    displayColumn: false,
  },
  {
    key: 'secondaryEmail',
    title: 'Secondary email',
    getRowVal: row => row.student.secondaryEmail,
    displayColumn: false,
  },
  {
    key: 'programme',
    title: 'Programme',
    getRowVal: row => getTextIn(row.programme.name),
    filterable: false,
  },
  {
    key: 'studytrack',
    title: 'Study track',
    getRowVal: row => getTextIn(row.programme.studyTrack?.name),
    displayColumn: studyTrackVisible,
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
        key: 'creditsHops',
        title: 'HOPS',
        getRowVal: row => row.credits.hops,
        filterType: 'range',
        forceToolsMode: 'floating',
      },
      {
        key: 'creditsTotal',
        title: 'Total',
        getRowVal: row => row.credits.all,
        filterType: 'range',
        forceToolsMode: 'floating',
      },
    ],
  },
  {
    key: 'latestAttainmentDates',
    title: 'Latest attainment date',
    children: [
      {
        key: 'latestAttainmentHops',
        title: 'HOPS',
        getRowVal: row => reformatDate(row.latestAttainmentDates.hops, 'YYYY-MM-DD'),
        filterType: 'date',
      },
      {
        key: 'latestAttainmentTotal',
        title: 'Total',
        getRowVal: row => reformatDate(row.latestAttainmentDates.total, 'YYYY-MM-DD'),
        filterType: 'date',
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
  useTitle('Students close to graduation')

  const { data: students, isError, isLoading } = useGetStudentsCloseToGraduationQuery()
  const { data: faculties = [] } = useGetFacultiesQuery()
  const programmes = useFilteredAndFormattedElementDetails()
  const { getTextIn } = useLanguage()
  const { visible: namesVisible } = useStudentNameVisibility()
  const [chosenFaculties, setChosenFaculties] = useState([])
  const [chosenProgrammes, setChosenProgrammes] = useState([])
  const [rowCount, setRowCount] = useState(0)

  const handleRowCountChange = count => setRowCount(count)

  const renderContent = () => {
    if (isError) {
      return (
        <Message content="Please try reloading the page." header="There was an error" icon="ban" negative size="big" />
      )
    }

    if (isLoading) return <Loader active inline="centered" />

    const facultyOptions = faculties.map(f => ({
      key: f.code,
      text: getTextIn(f.name),
      value: f.code,
      description: f.code,
    }))
    const programmeOptions = programmes
      .filter(p => !p.value.startsWith('MH') && !p.value.includes('+'))
      .filter(p => (chosenFaculties.length > 0 ? chosenFaculties.includes(p.value.slice(1, 4)) : true))
      .sort(createLocaleComparator('text'))
    const filteredStudents = students.filter(s => {
      if (chosenProgrammes.length > 0) return chosenProgrammes.includes(s.programme.code)
      return chosenFaculties.length === 0 || chosenFaculties.includes(s.programme.code.slice(1, 4))
    })

    return (
      <>
        <StudentNameVisibilityToggle style={{ marginBottom: '2em' }} />
        <Form style={{ width: '100%', marginBottom: '1em' }}>
          <Message info>
            You can filter students by choosing a degree programme and/or a faculty. You can also select multiple
            programmes or faculties. Please note that if you select a faculty, only the degree programmes belonging to
            that faculty will be shown.
          </Message>
          <Form.Field>
            <label>Faculties</label>
            <Dropdown
              multiple
              onChange={(_, { value }) => {
                setChosenFaculties([...value])
                setChosenProgrammes(chosenProgrammes.filter(p => value.includes(p.slice(1, 4))))
              }}
              options={facultyOptions}
              placeholder="Choose faculties..."
              search
              selection
              value={chosenFaculties}
            />
          </Form.Field>
          <Form.Field>
            <label>Degree programmes</label>
            <Dropdown
              multiple
              onChange={(_, { value }) => setChosenProgrammes([...value])}
              options={programmeOptions}
              placeholder="Choose degree programmes..."
              search
              selection
              value={chosenProgrammes}
            />
          </Form.Field>
        </Form>
        <SortableTable
          columns={getColumns(getTextIn, namesVisible, chosenProgrammes.length === 1)}
          data={filteredStudents}
          featureName="students_close_to_graduation"
          handleRowCountChange={handleRowCountChange}
          title={`Students close to graduation (${rowCount} out of ${students.length} students shown)`}
        />
      </>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Divider horizontal style={{ margin: '3em' }}>
        Students close to graduation
      </Divider>
      <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {renderContent()}
      </div>
    </div>
  )
}
