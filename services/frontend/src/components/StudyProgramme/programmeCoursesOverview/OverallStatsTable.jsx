import React from 'react'
import { Item, Icon } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import InfoToolTips from 'common/InfoToolTips'
import sendEvent from '../../../common/sendEvent'
import useLanguage from '../../LanguagePicker/useLanguage'
import SortableTable from '../../SortableTable'

const sendAnalytics = sendEvent.populationStatistics

const toolTips = InfoToolTips.Studyprogramme

const getColumns = (language, showStudents) => {
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
                    <Icon
                      name="level up alternate"
                      onClick={() => sendAnalytics('Courses of Population course stats button clicked', course.code)}
                    />
                  </Item>
                ),
              },
            ],
          },
          {
            key: 'name',
            title: 'Name',
            getRowVal: course => course.name[language],
            getRowContent: course => course.name[language],
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
            helpText: toolTips.NotCompleted,
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
            helpText: toolTips.NonDegree,
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
            helpText: toolTips.TransferredCourses,
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
                <Icon
                  name="level up alternate"
                  onClick={() => sendAnalytics('Courses of Population course stats button clicked', course.code)}
                />
              </Item>
            ),
          },
        ],
      },
      {
        key: 'name',
        title: 'Name',
        getRowVal: course => course.name[language],
        getRowContent: course => course.name[language],
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
        helpText: toolTips.NonDegree,
        cellStyle: { textAlign: 'right' },
        filterType: 'range',
        getRowVal: course => course.totalWithoutStudyrightCredits,
        getRowContent: course => course.totalWithoutStudyrightCredits,
      },
      {
        key: 'totalTransfer',
        title: 'Transferred credits',
        helpText: toolTips.TransferredCredits,
        cellStyle: { textAlign: 'right' },
        filterType: 'range',
        getRowVal: course => course.totalTransferCredits,
        getRowContent: course => course.totalTransferCredits,
      },
    ]
  }

  return columns
}

const OverallStatsTable = ({ data, showStudents }) => {
  const { language } = useLanguage()
  return (
    <div data-cy="CoursesSortableTable">
      <SortableTable
        title={`Student statistics for studyprogramme courses `}
        defaultSort={['name', 'asc']}
        defaultdescending
        getRowKey={course => course.code}
        tableProps={{ celled: true, fixed: true }}
        columns={getColumns(language, showStudents)}
        data={data}
      />
    </div>
  )
}

export default OverallStatsTable
