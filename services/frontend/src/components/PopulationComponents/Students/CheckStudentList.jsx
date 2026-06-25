import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { arrayOf, string } from 'prop-types'
import { useState } from 'react'

import { ExpandMoreIcon } from '@/theme'

export const CheckStudentList = ({ students }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [resultModalOpen, setResultModalOpen] = useState(false)

  const [input, setInput] = useState('')
  const [foundStudents, setFoundStudents] = useState([])
  const [notInSisuRows, setNotInSisuRows] = useState([])
  const [notInListRows, setNotInListRows] = useState([])

  const closeDialog = () => {
    setResultModalOpen(false)
    setModalOpen(false)
  }

  const checkStudents = input => {
    const studentnumbers = input.match(/[^\s,]+/g) ?? []
    const foundStudents = studentnumbers.filter(studentnumber => students.includes(studentnumber))
    const notInSisu = studentnumbers.filter(studentnumber => !students.includes(studentnumber))
    const notInList = students.filter(student => !studentnumbers.includes(student))

    setFoundStudents(foundStudents)
    setNotInSisuRows(notInSisu)
    setNotInListRows(notInList)

    setResultModalOpen(true)
  }

  const panels = [
    {
      key: 'found',
      title: 'Student numbers in list and in Sisu',
      content:
        foundStudents.length === 0 ? (
          'No numbers in list and Sisu'
        ) : (
          <>
            {foundStudents.map(studentNumber => (
              <div key={studentNumber}>{studentNumber}</div>
            ))}
          </>
        ),
    },
    {
      key: 'not-found',
      title: 'Student numbers in list but not in Sisu',
      content:
        notInSisuRows.length === 0 ? (
          'All numbers in Sisu'
        ) : (
          <>
            {notInSisuRows.map(studentNumber => (
              <div key={studentNumber}>{studentNumber}</div>
            ))}
          </>
        ),
    },
    {
      key: 'not-searched',
      title: 'Student numbers in Sisu but not in list',
      content:
        notInListRows.length === 0 ? (
          'All numbers in list'
        ) : (
          <>
            {notInListRows.map(studentNumber => (
              <div key={studentNumber}>{studentNumber}</div>
            ))}
          </>
        ),
    },
  ]

  return (
    <>
      <Button onClick={() => setModalOpen(true)} variant="outlined">
        Check student numbers
      </Button>
      <Dialog onClose={() => closeDialog()} open={modalOpen}>
        {!resultModalOpen ? (
          <Paper sx={{ padding: 2 }}>
            <h2>Check for student numbers</h2>
            <Stack>
              <em>Insert student numbers you wish to check here</em>
              <TextField
                data-cy="check-student-numbers"
                minRows={2}
                multiline
                onChange={element => setInput(element.target.value)}
                placeholder={'012345678\n012345679'}
              />
            </Stack>
            <Box sx={{ gap: 0.5, textAlign: 'right' }}>
              <Button
                color="primary"
                disabled={input.length === 0}
                onClick={() => checkStudents(input)}
                variant="outlined"
              >
                Check students
              </Button>
              <Button color="error" onClick={() => closeDialog()} variant="outlined">
                Cancel
              </Button>
            </Box>
          </Paper>
        ) : (
          <Paper sx={{ padding: 2 }}>
            <div id="checkstudentsresults">
              <Typography content="Results" variant="h6" />
              {panels.map(({ key, title, content }) => (
                <Accordion
                  disableGutters
                  key={key}
                  slotProps={{ transition: { unmountOnExit: true } }}
                  sx={{
                    backgroundColor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    boxShadow: 'none',
                    overflow: 'hidden',
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography
                      component="span"
                      data-cy={`${key}-title`}
                      sx={{ fontSize: 'large', fontWeight: 'bold' }}
                      variant="h6"
                    >
                      {title}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails data-cy={`${key}-data`}>{content}</AccordionDetails>
                </Accordion>
              ))}
            </div>
            <Box sx={{ gap: 0.5, textAlign: 'right' }}>
              <Button color="error" onClick={() => setResultModalOpen(false)} variant="outlined">
                Close
              </Button>
            </Box>
          </Paper>
        )}
      </Dialog>
    </>
  )
}

CheckStudentList.propTypes = {
  students: arrayOf(string).isRequired,
}
