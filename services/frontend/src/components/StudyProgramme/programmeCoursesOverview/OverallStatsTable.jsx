import React from 'react'
import { Item, Icon } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import InfoToolTips from 'common/InfoToolTips'
import InfoBox from 'components/Info/InfoBox'
import sendEvent from '../../../common/sendEvent'
import useLanguage from '../../LanguagePicker/useLanguage'
import SortableTable from '../../SortableTable'

const sendAnalytics = sendEvent.populationStatistics

const toolTips = InfoToolTips.Studyprogramme

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
        helpText: toolTips.Name,
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

  return columns
}

const OverallStatsTable = ({ data, showStudents }) => {
  const { getTextIn } = useLanguage()
  return (
    <>
      <InfoBox
        content={showStudents ? toolTips.StudentsOfProgrammeCourses : toolTips.CreditsProducedByTheStudyprogramme}
        cypress="programme-courses"
      />
      <div data-cy="CoursesSortableTable">
        <SortableTable
          title={`Student statistics for study programme courses `}
          defaultSort={['name', 'asc']}
          defaultdescending
          tableProps={{ celled: true, fixed: true }}
          columns={getColumns(getTextIn, showStudents)}
          data={data}
        />
      </div>
    </>
  )
}

export default OverallStatsTable
