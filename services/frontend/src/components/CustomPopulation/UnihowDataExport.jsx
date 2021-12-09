import React from 'react'
import moment from 'moment'
import xlsx from 'xlsx'
import { Dropdown } from 'semantic-ui-react'
import { getStudentGradeMean, getStudentGradeMeanWeightedByCredits, getStudentTotalCredits } from '../../common'
import sendEvent from '../../common/sendEvent'
import DataExport from '../PopulationStatistics/DataExport'

const sendAnalytics = sendEvent.populationStudents

export default ({ students }) => {
  const getXlsx = () => {
    const data = students.map(student => ({
      'Student Number': student.studentNumber,
      'Total Credits (no transferred credits)': getStudentTotalCredits(student, false),
      'Grade Mean (no transferred credits)': getStudentGradeMean(student, false),
      'Grade Mean Weighted by ECTS (no transferred credits)': getStudentGradeMeanWeightedByCredits(student, false),
    }))

    const sheet = xlsx.utils.json_to_sheet(data)

    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, sheet)
    return workbook
  }

  const filename = `oodikone_export_${students.length}_students_${moment().format('YYYYMMDD-hhmmss')}.xlsx`

  return (
    <>
      <DataExport students={students} />
      <Dropdown.Item
        onClick={() => {
          xlsx.writeFile(getXlsx(), filename)
          sendAnalytics('Download excel button clicked', 'Download excel button clicked (UniHow)')
        }}
        text="Excel Workbook (UniHow)"
        icon="file excel"
      />
    </>
  )
}
