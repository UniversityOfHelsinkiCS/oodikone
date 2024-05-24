import _ from 'lodash'
import { useState } from 'react'
import { Divider, Dropdown, Form, Icon, Loader, Message, Radio, Tab, Table } from 'semantic-ui-react'

import {
  createLocaleComparator,
  getCurrentSemester,
  getEnrollmentTypeTextForExcel,
  isFall,
  reformatDate,
} from '@/common'
import { useTitle } from '@/common/hooks'
import { StudentInfoItem } from '@/components/common/StudentInfoItem'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { getSemestersPresentFunctions } from '@/components/PopulationStudents/StudentTable/GeneralTab/columnHelpers/semestersPresent'
import { PaginatedSortableTable } from '@/components/SortableTable/PaginatedSortableTable'
import { StudentNameVisibilityToggle, useStudentNameVisibility } from '@/components/StudentNameVisibilityToggle'
import { useGetStudentsCloseToGraduationQuery } from '@/redux/closeToGraduation'
import { useFilteredAndFormattedElementDetails } from '@/redux/elementdetails'
import { useGetFacultiesQuery } from '@/redux/facultyStats'
import { useGetSemestersQuery } from '@/redux/semesters'

const NUMBER_OF_DISPLAYED_SEMESTERS = 6

const getColumns = (
  getTextIn,
  namesVisible,
  semesterEnrollmentsVisible,
  studyTrackVisible,
  allSemestersMap,
  bachelorStudentsAreDisplayed,
  semesterEnrollmentFunctions
) => {
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
      getRowVal: row => getTextIn(row.programme.studyTrack),
      displayColumn: studyTrackVisible,
    },
    {
      key: 'startOfStudyright',
      title: 'Start of studyright',
      getRowVal: row => row.studyright.startDate,
      formatValue: date => reformatDate(date, 'YYYY-MM-DD'),
      filterType: 'date',
    },
    {
      key: 'startedInProgramme',
      title: 'Started in programme',
      getRowVal: row => row.programme.startedAt,
      formatValue: date => reformatDate(date, 'YYYY-MM-DD'),
      filterType: 'date',
      displayColumn: !bachelorStudentsAreDisplayed,
      helpText:
        "For students with only a study right in the master’s programme, this date is the same as 'Start of studyright'. For students with study rights in both the bachelor’s and master’s programmes, this date represents when they started in the master’s programme (i.e. one day after graduating from the bachelor’s programme).",
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
          helpText: "The credits earned from courses in the student's primary study plan",
        },
        {
          key: 'creditsTotal',
          title: 'Total',
          getRowVal: row => row.credits.all,
          filterType: 'range',
          helpText: 'The total number of credits the student has earned at the university',
        },
      ],
    },
    {
      key: 'isBaMa',
      title: 'Continued\nfrom\nbachelor’s',
      getRowVal: row => (row.studyright.isBaMa ? 'Continued from bachelor’s' : 'Not continued from bachelor’s'),
      getRowContent: row => (row.studyright.isBaMa ? <Icon color="green" name="check" /> : null),
      getRowExportVal: row => (row.studyright.isBaMa ? '1' : null),
      cellProps: () => ({ style: { textAlign: 'center' } }),
      displayColumn: !bachelorStudentsAreDisplayed,
      helpText: 'Indicates whether the student has continued their studies from a bachelor’s degree',
    },
    {
      key: 'curriculumPeriod',
      title: 'Curriculum\nperiod',
      getRowVal: row => row.curriculumPeriod,
      helpText: 'The curriculum period the student has chosen for their primary study plan',
    },
    {
      key: 'semesterEnrollments',
      title: 'Semesters\npresent',
      filterType: 'range',
      displayColumn: semesterEnrollmentsVisible,
      export: false,
      getRowContent: row => getSemesterEnrollmentsContent(row.student, [row.studyright]),
      getRowVal: row => getSemesterEnrollmentsVal(row.student, row.studyright),
    },
    {
      key: 'semesterEnrollmentsForExcel',
      title: 'Enrollment status',
      displayColumn: false,
      children: semestersToInclude.map(semester => ({
        key: `${semester}`,
        title: getTextIn(allSemestersMap[`${semester}`]?.name),
        displayColumn: false,
        getRowVal: student => {
          const enrollment = student.studyright.semesterEnrollments.find(
            enrollment => enrollment.semestercode === semester
          )
          return getEnrollmentTypeTextForExcel(enrollment?.enrollmenttype, enrollment?.statutoryAbsence)
        },
      })),
    },
    {
      key: 'thesisCompleted',
      title: 'Thesis\ncompleted',
      getRowVal: row => (row.thesisInfo ? 'Thesis completed' : 'Thesis not completed'),
      getRowContent: row => (row.thesisInfo ? <Icon color="green" name="check" /> : null),
      getRowExportVal: row => (row.thesisInfo ? '1' : null),
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
      helpText: 'You can see the attainment date, course code, and grade by hovering over the check mark',
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
          helpText: 'The date when the student last completed a course in their primary study plan',
        },
        {
          key: 'latestAttainmentTotal',
          title: 'Total',
          getRowVal: row => reformatDate(row.latestAttainmentDates.total, 'YYYY-MM-DD'),
          filterType: 'date',
          helpText: 'The date when the student last completed any course at the university',
        },
      ],
    },
  ]
}

export const CloseToGraduation = () => {
  useTitle('Students close to graduation')

  const { data: students = {}, isError, isLoading } = useGetStudentsCloseToGraduationQuery()
  const { data: faculties = [] } = useGetFacultiesQuery()
  const { data: semesterData = [] } = useGetSemestersQuery()
  const programmes = useFilteredAndFormattedElementDetails()
  const { getTextIn } = useLanguage()
  const { visible: namesVisible } = useStudentNameVisibility()
  const [chosenFaculties, setChosenFaculties] = useState([])
  const [chosenProgrammes, setChosenProgrammes] = useState([])
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [rowCount, setRowCount] = useState(0)
  const [semesterEnrollmentsVisible, setSemesterEnrollmentsVisible] = useState(false)
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
  const { bachelor = [], masterAndLicentiate = [] } = students

  const bachelorStudentsAreDisplayed = activeTabIndex === 0
  const displayedStudents = bachelorStudentsAreDisplayed ? bachelor : masterAndLicentiate

  const handleDisplayedDataChange = students => setRowCount(students.length)

  const filteredStudents = displayedStudents.filter(s => {
    if (chosenProgrammes.length > 0) return chosenProgrammes.includes(s.programme.code)
    return chosenFaculties.length === 0 || chosenFaculties.includes(s.programme.code.slice(1, 4))
  })

  const studyTrackVisible =
    chosenProgrammes.length === 1 && filteredStudents.some(student => student.programme.studyTrack != null)

  const columns = getColumns(
    getTextIn,
    namesVisible,
    semesterEnrollmentsVisible,
    studyTrackVisible,
    allSemestersMap,
    bachelorStudentsAreDisplayed,
    {
      getSemesterEnrollmentsContent,
      getSemesterEnrollmentsVal,
    }
  )

  const onTabChange = (e, { activeIndex }) => {
    setActiveTabIndex(activeIndex)
    setChosenFaculties([])
    setChosenProgrammes([])
  }

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
      .filter(p => !p.value.includes('+') && p.value.startsWith(bachelorStudentsAreDisplayed ? 'KH' : 'MH'))
      .filter(p => (chosenFaculties.length > 0 ? chosenFaculties.includes(p.value.slice(1, 4)) : true))
      .sort(createLocaleComparator('text'))

    return (
      <Tab.Pane>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Form style={{ width: '100%', marginBottom: '1em' }}>
            <Message info>
              You can filter students by choosing a degree programme and/or a faculty. You can also select multiple
              programmes or faculties. Please note that if you select a faculty, only the degree programmes of that
              faculty will be shown.
              <br />
              <br />
              Students are included in this list based on the number of credits they have completed in their primary
              study plan. The limits for each study programme are as follows:
              <Table basic="very" celled collapsing compact="very">
                <Table.Body>
                  <Table.Row>
                    <Table.Cell>
                      <b>Degree programme</b>
                    </Table.Cell>
                    <Table.Cell>
                      <b>Limit</b>
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>All bachelor's programmes</Table.Cell>
                    <Table.Cell>160</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>{programmes.find(p => p.value === 'MH90_001')?.text}</Table.Cell>
                    <Table.Cell>150</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>{programmes.find(p => p.value === 'MH30_001')?.text}</Table.Cell>
                    <Table.Cell>330</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>{programmes.find(p => p.value === 'MH30_003')?.text}</Table.Cell>
                    <Table.Cell>300</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>{programmes.find(p => p.value === 'MH30_004')?.text}</Table.Cell>
                    <Table.Cell>115</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Other master's programmes</Table.Cell>
                    <Table.Cell>85</Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table>
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
            defaultSort={['programme', 'asc']}
            featureName="students_close_to_graduation"
            handleDisplayedDataChange={handleDisplayedDataChange}
            rowCount={rowCount}
            rowsPerPage={200}
            title={`Students close to graduation (${rowCount} out of ${displayedStudents.length} students selected)`}
          />
        </div>
      </Tab.Pane>
    )
  }

  const panes = [
    {
      menuItem: "Bachelor's programmes",
      render: renderContent,
    },
    {
      menuItem: "Master's and licentiate's programmes",
      render: renderContent,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Divider horizontal style={{ margin: '3em' }}>
        Students close to graduation
      </Divider>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '2em',
          padding: '2em',
          gap: '2em',
        }}
      >
        <StudentNameVisibilityToggle style={{ marginTop: '0', marginBottom: '0' }} />
        <Radio
          checked={semesterEnrollmentsVisible}
          label="Show semester enrollments"
          onChange={() => setSemesterEnrollmentsVisible(!semesterEnrollmentsVisible)}
          toggle
        />
      </div>
      <Tab activeIndex={activeTabIndex} onTabChange={onTabChange} panes={panes} style={{ maxWidth: '80%' }} />
    </div>
  )
}
