import React from 'react'
import { Button, Popup } from 'semantic-ui-react'
import xlsx from 'xlsx'
import { getStudentGradeMean, getStudentGradeMeanWeightedByCredits, getStudentTotalCredits, getTimestamp } from 'common'

export const UnihowDataExport = ({ students }) => {
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

  const filename = `oodikone_export_${students.length}_students_${getTimestamp()}.xlsx`

  return (
    <Popup
      trigger={
        <Button
          icon="file excel"
          content="Excel Workbook (UniHow)"
          labelPosition="left"
          onClick={() => xlsx.writeFile(getXlsx(), filename)}
        />
      }
      content="Click here to download a specialized Excel workbook with UniHow data."
      position="top center"
    />
  )
}
