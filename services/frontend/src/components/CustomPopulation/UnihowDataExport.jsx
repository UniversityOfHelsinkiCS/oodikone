import React from 'react'
import { Button, Popup } from 'semantic-ui-react'
import { utils, writeFile } from 'xlsx'
import { getStudentGradeMean, getStudentGradeMeanWeightedByCredits, getStudentTotalCredits, getTimestamp } from 'common'

export const UnihowDataExport = ({ students }) => {
  const getXlsx = () => {
    const data = students.map(student => ({
      'Student Number': student.studentNumber,
      'Total Credits (no transferred credits)': getStudentTotalCredits(student, false),
      'Grade Mean (no transferred credits)': getStudentGradeMean(student, false),
      'Grade Mean Weighted by ECTS (no transferred credits)': getStudentGradeMeanWeightedByCredits(student, false),
    }))

    const sheet = utils.json_to_sheet(data)

    const workbook = utils.book_new()
    utils.book_append_sheet(workbook, sheet)
    return workbook
  }

  const filename = `oodikone_export_${students.length}_students_${getTimestamp()}.xlsx`

  return (
    <Popup
      content="Click here to download a specialized Excel workbook with UniHow data."
      position="top center"
      trigger={
        <Button
          content="Excel Workbook (UniHow)"
          icon="file excel"
          labelPosition="left"
          onClick={() => writeFile(getXlsx(), filename)}
        />
      }
    />
  )
}
