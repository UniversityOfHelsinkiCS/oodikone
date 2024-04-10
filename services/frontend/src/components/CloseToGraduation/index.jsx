import _ from 'lodash'
import React, { useState } from 'react'
import { Divider, Dropdown, Form, Icon, Loader, Message } from 'semantic-ui-react'

import { createLocaleComparator, getCurrentSemester, isFall, reformatDate } from '@/common'
import { useTitle } from '@/common/hooks'
import { StudentInfoItem } from '@/components/common/StudentInfoItem'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { PaginatedSortableTable } from '@/components/SortableTable/PaginatedSortableTable'
import { StudentNameVisibilityToggle, useStudentNameVisibility } from '@/components/StudentNameVisibilityToggle'
import { useGetStudentsCloseToGraduationQuery } from '@/redux/closeToGraduation'
import { useFilteredAndFormattedElementDetails } from '@/redux/elementdetails'
import { useGetFacultiesQuery } from '@/redux/facultyStats'
import { useGetSemestersQuery } from '@/redux/semesters'
import { getSemestersPresentFunctions } from '../PopulationStudents/StudentTable/GeneralTab/columnHelpers/semestersPresent'

const NUMBER_OF_DISPLAYED_SEMESTERS = 6

const getEnrollmentTypeTextForExcel = (type, statutoryAbsence) => {
  if (type === 1) return 'Present'
  if (type === 2 && statutoryAbsence) return 'Absent (statutory)'
  if (type === 2) return 'Absent'
  if (type === 3) return 'Not enrolled'
  return 'No study right'
}

const getColumns = (getTextIn, namesVisible, studyTrackVisible, allSemestersMap, semesterEnrollmentFunctions) => {
  const { getSemesterEnrollmentsContent, getSemesterEnrollmentsVal } = semesterEnrollmentFunctions
  const currentSemesterCode = getCurrentSemester(allSemestersMap)?.semestercode
  const semestersToInclude = _.range(
    isFall(currentSemesterCode)
      ? currentSemesterCode - NUMBER_OF_DISPLAYED_SEMESTERS + 2
      : currentSemesterCode - NUMBER_OF_DISPLAYED_SEMESTERS + 1,
    isFall(currentSemesterCode) ? currentSemesterCode + 2 : currentSemesterCode + 1
  )
  return [
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
      getRowVal: row => row.studyright.startDate,
      getRowContent: row => reformatDate(row.studyright.startDate, 'YYYY-MM-DD'),
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
      key: 'semesterEnrollments',
      title: 'Semesters\npresent',
      filterType: 'range',
      export: false,
      getRowContent: row => getSemesterEnrollmentsContent(row.student, [row.studyright]),
      getRowVal: row => getSemesterEnrollmentsVal(row.student, row.studyright),
    },
    {
      key: 'semesterEnrollmentsForExcel',
      title: 'Enrollment status',
      displayColumn: false,
      children: semestersToInclude.map(sem => ({
        key: `${sem}`,
        title: getTextIn(allSemestersMap[`${sem}`]?.name),
        displayColumn: false,
        getRowVal: student => {
          const enrollment = student.studyright.semesterEnrollments.find(e => e.semestercode === sem)
          return getEnrollmentTypeTextForExcel(enrollment?.enrollmenttype, enrollment?.statutoryAbsence)
        },
      })),
    },
    {
      key: 'thesisCompleted',
      title: 'Thesis\ncompleted',
      getRowVal: row => (row.thesisInfo ? 'Thesis completed' : 'Thesis not completed'),
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
  ]
}

export const CloseToGraduation = () => {
  useTitle('Students close to graduation')

  const { data: students, isError, isLoading } = useGetStudentsCloseToGraduationQuery()
  const { data: faculties = [] } = useGetFacultiesQuery()
  const { data: semesterData = [] } = useGetSemestersQuery()
  const programmes = useFilteredAndFormattedElementDetails()
  const { getTextIn } = useLanguage()
  const { visible: namesVisible } = useStudentNameVisibility()
  const [chosenFaculties, setChosenFaculties] = useState([])
  const [chosenProgrammes, setChosenProgrammes] = useState([])
  const [rowCount, setRowCount] = useState(0)
  const allSemesters = Object.entries(semesterData?.semesters || {}).map(item => item[1])
  const allSemestersMap = allSemesters.reduce((obj, cur, index) => {
    obj[index + 1] = cur
    return obj
  }, {})
  const { getSemesterEnrollmentsContent, getSemesterEnrollmentsVal } = getSemestersPresentFunctions({
    getTextIn,
    allSemesters,
    allSemestersMap,
    filteredStudents: students,
    year: `${new Date().getFullYear() - Math.floor(NUMBER_OF_DISPLAYED_SEMESTERS / 2)}`,
  })

  const handleRowCountChange = count => setRowCount(count)

  const columns = getColumns(getTextIn, namesVisible, chosenProgrammes.length === 1, allSemestersMap, {
    getSemesterEnrollmentsContent,
    getSemesterEnrollmentsVal,
  })

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
        <PaginatedSortableTable
          columns={columns}
          data={filteredStudents}
          featureName="students_close_to_graduation"
          handleRowCountChange={handleRowCountChange}
          rowCount={rowCount}
          rowsPerPage={200}
          title={`Students close to graduation (${rowCount} out of ${students.length} students selected)`}
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
