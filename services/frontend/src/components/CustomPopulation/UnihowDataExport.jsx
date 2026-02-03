import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import { utils, writeFile } from 'xlsx'

import { getStudentGradeMean, getStudentGradeMeanWeightedByCredits, getStudentTotalCredits } from '@/common'
import { FileDownloadIcon } from '@/theme'
import { getTimestamp } from '@/util/timeAndDate'

export const UnihowDataExport = ({ students }) => {
  const getXlsx = () => {
    const data = students.map(student => ({
      'Student number': student.studentNumber,
      'Total credits (no transferred credits)': getStudentTotalCredits(student, false),
      'Grade mean (no transferred credits)': getStudentGradeMean(student, false),
      'Grade mean weighted by ECTS (no transferred credits)': getStudentGradeMeanWeightedByCredits(student, false),
    }))

    const sheet = utils.json_to_sheet(data)

    const workbook = utils.book_new()
    utils.book_append_sheet(workbook, sheet)
    return workbook
  }

  const filename = `oodikone_export_${students.length}_students_${getTimestamp()}.xlsx`

  return (
    <Tooltip title="Click here to download a specialized Excel workbook with UniHow data.">
      <Button
        color="primary"
        onClick={() => writeFile(getXlsx(), filename)}
        startIcon={<FileDownloadIcon />}
        variant="contained"
      >
        Export (UniHow)
      </Button>
    </Tooltip>
  )
}
