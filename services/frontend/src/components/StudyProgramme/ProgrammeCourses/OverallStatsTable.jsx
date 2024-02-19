import React, { useEffect, useState } from 'react'
import { Item, Icon, Segment, Header, Loader } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import { max, min, range } from 'lodash'

import { studyProgrammeToolTips } from 'common/InfoToolTips'
import { InfoBox } from 'components/Info/InfoBox'
import { useGetProgrammeCoursesStatsQuery } from 'redux/studyProgramme'
import { useLanguage } from '../../LanguagePicker/useLanguage'
import { SortableTable } from '../../SortableTable'
import { CourseYearFilter } from './CourseYearFilter'
import { Toggle } from '../Toggle'

const getColumns = (getTextIn, showStudents) => {
  let columns = null

  if (showStudents) {
    columns = [
      {
        key: 'Course',
        title: 'Course info',
        parent: true,
        children: [
          {
            key: 'code',
            mergeHeader: true,
            merge: true,
            children: [
              {
                key: 'course_code',
                title: 'Code ',
                export: true,
                getRowVal: course => course.code,
                getRowContent: course => course.code,
              },
              {
                key: 'go-to-course',
                export: false,
                getRowContent: course => (
                  <Item
                    as={Link}
                    to={`/coursestatistics?courseCodes=["${encodeURIComponent(
                      course.code
                    )}"]&separate=false&unifyOpenUniCourses=false`}
                  >
                    <Icon name="level up alternate" />
                  </Item>
                ),
              },
            ],
          },
          {
            key: 'name',
            title: 'Name',
            getRowVal: course => getTextIn(course.name),
            getRowContent: course =>
              getTextIn(course.name).length > 46 ? `${getTextIn(course.name).slice(0, 44)}...` : getTextIn(course.name),
            cellProps: course => {
              return { title: getTextIn(course.name) }
            },
          },
        ],
      },
      {
        key: 'total',
        title: '',
        parent: true,
        children: [
          {
            key: 'total',
            title: 'Total',
            cellStyle: { textAlign: 'right' },
            filterType: 'range',
            getRowVal: course => course.totalAllStudents,
            getRowContent: course => course.totalAllStudents,
          },
        ],
      },
      {
        key: 'breakdown',
        title: 'Breakdown of Total',
        parent: true,
        children: [
          {
            key: 'passed',
            title: 'Passed',
            cellStyle: { textAlign: 'right' },
            filterType: 'range',
            getRowVal: course => course.totalAllPassed,
            getRowContent: course => course.totalAllPassed,
          },
          {
            key: 'not-completed',
            title: 'Not Completed',
            cellStyle: { textAlign: 'right' },
            filterType: 'range',
            getRowVal: course => course.totalAllNotCompleted,
            getRowContent: course => course.totalAllNotCompleted,
          },
        ],
      },
      {
        key: 'breakdown-passed',
        title: 'Breakdown Statistics of Passed Students',
        parent: true,
        children: [
          {
            key: 'totalOwnProgramme',
            title: 'Major students',
            cellStyle: { textAlign: 'right' },
            filterType: 'range',
            getRowVal: course => course.totalProgrammeStudents,
            getRowContent: course => course.totalProgrammeStudents,
          },
          {
            key: 'totalOtherProgramme',
            title: 'Non-major students',
            cellStyle: { textAlign: 'right' },
            filterType: 'range',
            getRowVal: course => course.totalOtherProgrammeStudents,
            getRowContent: course => course.totalOtherProgrammeStudents,
          },
          {
            key: 'totalWithoutStudyright',
            title: 'Non-degree students',
            cellStyle: { textAlign: 'right' },
            filterType: 'range',
            getRowVal: course => course.totalWithoutStudyrightStudents,
            getRowContent: course => course.totalWithoutStudyrightStudents,
          },
        ],
      },
      {
        key: 'exluded',
        title: 'Not Included to Passed',
        parent: true,
        children: [
          {
            key: 'transfer',
            title: 'Transferred students',
            helpText: studyProgrammeToolTips.TransferredCourses,
            cellStyle: { textAlign: 'right' },
            filterType: 'range',
            getRowVal: course => course.totalTransferStudents,
            getRowContent: course => course.totalTransferStudents,
          },
        ],
      },
    ]
  } else {
    columns = [
      {
        key: 'code',
        mergeHeader: true,
        merge: true,
        children: [
          {
            key: 'course_code',
            title: 'Code ',
            export: true,
            getRowVal: course => course.code,
            getRowContent: course => course.code,
          },
          {
            key: 'go-to-course',
            export: false,
            getRowContent: course => (
              <Item
                as={Link}
                to={`/coursestatistics?courseCodes=["${encodeURIComponent(
                  course.code
                )}"]&separate=false&unifyOpenUniCourses=false`}
              >
                <Icon name="level up alternate" />
              </Item>
            ),
          },
        ],
      },
      {
        key: 'name',
        title: 'Name',
        helpText: studyProgrammeToolTips.Name,
        getRowVal: course => getTextIn(course.name),
        getRowContent: course =>
          getTextIn(course.name).length > 46 ? `${getTextIn(course.name).slice(0, 44)}...` : getTextIn(course.name),
        cellProps: course => {
          return { title: getTextIn(course.name) }
        },
      },
      {
        key: 'total',
        title: 'Total credits',
        cellStyle: { textAlign: 'right' },
        filterType: 'range',
        getRowVal: course => course.totalAllCredits,
        getRowContent: course => course.totalAllCredits,
      },
      {
        key: 'totalOwnProgramme',
        title: 'Major credits',
        cellStyle: { textAlign: 'right' },
        filterType: 'range',
        getRowVal: course => course.totalProgrammeCredits,
        getRowContent: course => course.totalProgrammeCredits,
      },
      {
        key: 'totalOtherProgramme',
        title: 'Non-major credits',
        cellStyle: { textAlign: 'right' },
        filterType: 'range',
        getRowVal: course => course.totalOtherProgrammeCredits,
        getRowContent: course => course.totalOtherProgrammeCredits,
      },
      {
        key: 'totalWithoutStudyright',
        title: 'Non-degree credits',
        cellStyle: { textAlign: 'right' },
        filterType: 'range',
        getRowVal: course => course.totalWithoutStudyrightCredits,
        getRowContent: course => course.totalWithoutStudyrightCredits,
      },
      {
        key: 'totalTransfer',
        title: 'Transferred credits',
        cellStyle: { textAlign: 'right' },
        filterType: 'range',
        getRowVal: course => course.totalTransferCredits,
        getRowContent: course => course.totalTransferCredits,
      },
    ]
  }
  const typeColumn = {
    key: 'type',
    title: 'Type',
    getRowVal: course => (course.isStudyModule ? 'Module' : 'Course'),
  }
  return [...columns, typeColumn]
}

export const OverallStatsTable = ({ studyProgramme, combinedProgramme, academicYear, setAcademicYear }) => {
  const { data, error, isLoading } = useGetProgrammeCoursesStatsQuery({
    id: studyProgramme,
    academicyear: academicYear ? 'ACADEMIC_YEAR' : 'NOT_ACADEMIC_YEAR',
    combinedProgramme,
  })
  const { getTextIn } = useLanguage()

  const [fromYear, setFromYear] = useState(null)
  const [toYear, setToYear] = useState(null)
  const [years, setYears] = useState({})
  const [showStudents, setShowStudents] = useState(false)
  // fromYear and toYear initial values are calculated from data and hence useEffect
  useEffect(() => {
    if (data) {
      const yearcodes = [...new Set(data.map(s => Object.keys(s.years)).flat())]
      const initFromYear = Number(min(yearcodes))
      const initToYear = Number(max(yearcodes))
      if (!fromYear) setFromYear(initFromYear)
      if (!toYear) setToYear(initToYear)
      const normal = []
      const academic = []
      for (let i = initFromYear; i <= initToYear; i++) {
        normal.push({ key: i, text: i.toString(), value: i })
        academic.push({ key: i, text: `${i}-${i + 1}`, value: i })
      }
      if (!fromYear && !toYear) setYears({ normal, academic })
    }
  }, [data])

  if (isLoading) {
    return <Loader active style={{ marginTop: '10em' }} />
  }

  if (error) return <h3>Something went wrong, please try refreshing the page.</h3>

  const handleYearChange = (e, { name, value }) => {
    if (name === 'fromYear' && value <= toYear) setFromYear(value)
    else if (name === 'toYear' && value >= fromYear) setToYear(value)
  }

  const filterDataByYear = (data, fromYear, toYear) => {
    const yearRange = range(fromYear, Number(toYear) + 1)
    const filteredAndmergedCourses = data
      .filter(c => {
        const arr = Object.keys(c.years).some(key => yearRange.includes(Number(key)))
        return arr
      })
      .map(course => {
        const values = Object.entries(course.years).reduce(
          (acc, curr) => {
            if (yearRange.includes(Number(curr[0]))) {
              acc.totalAllStudents += curr[1].totalAllStudents
              acc.totalAllPassed += curr[1].totalPassed
              acc.totalAllNotCompleted += curr[1].totalNotCompleted
              acc.totalAllCredits += curr[1].totalAllCredits
              acc.totalProgrammeStudents += curr[1].totalProgrammeStudents
              acc.totalProgrammeCredits += curr[1].totalProgrammeCredits
              acc.totalOtherProgrammeStudents += curr[1].totalOtherProgrammeStudents
              acc.totalOtherProgrammeCredits += curr[1].totalOtherProgrammeCredits
              acc.totalWithoutStudyrightStudents += curr[1].totalWithoutStudyrightStudents
              acc.totalWithoutStudyrightCredits += curr[1].totalWithoutStudyrightCredits
              acc.totalTransferCredits += curr[1].totalTransferCredits
              acc.totalTransferStudents += curr[1].totalTransferStudents
            }

            return acc
          },
          {
            totalAllStudents: 0,
            totalAllPassed: 0,
            totalAllNotCompleted: 0,
            totalAllCredits: 0,
            totalProgrammeStudents: 0,
            totalProgrammeCredits: 0,
            totalOtherProgrammeStudents: 0,
            totalOtherProgrammeCredits: 0,
            totalWithoutStudyrightStudents: 0,
            totalWithoutStudyrightCredits: 0,
            totalTransferCredits: 0,
            totalTransferStudents: 0,
          }
        )
        return {
          ...values,
          code: course.code,
          name: course.name,
          isStudyModule: course.isStudyModule,
        }
      })

    return filteredAndmergedCourses
  }

  return (
    <>
      <Segment style={{ marginTop: '1rem' }}>
        <Header as="h4">Time range</Header>
        <CourseYearFilter
          years={academicYear ? years.academic : years.normal}
          fromYear={fromYear}
          toYear={toYear}
          handleChange={handleYearChange}
          academicYear={academicYear}
          setAcademicYear={setAcademicYear}
        />
      </Segment>
      <Toggle
        cypress="creditsStudentsToggle"
        toolTips={null}
        firstLabel="Show credits"
        secondLabel="Show students"
        value={showStudents}
        setValue={setShowStudents}
      />
      <InfoBox
        content={
          showStudents
            ? studyProgrammeToolTips.StudentsOfProgrammeCourses
            : studyProgrammeToolTips.CreditsProducedByTheStudyprogramme
        }
        cypress="programme-courses"
      />
      <div data-cy="CoursesSortableTable">
        <SortableTable
          title="Student statistics for study programme courses"
          featureName="programme_courses"
          defaultSort={['name', 'asc']}
          columns={getColumns(getTextIn, showStudents)}
          data={filterDataByYear(data, fromYear, toYear)}
        />
      </div>
    </>
  )
}
