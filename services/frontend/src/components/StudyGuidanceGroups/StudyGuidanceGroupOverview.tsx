import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import ModeIcon from '@mui/icons-material/Mode'
import ArrowIcon from '@mui/icons-material/NorthEast'
import SaveIcon from '@mui/icons-material/Save'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

import { useEffect, useState } from 'react'

import { StyledMessage } from '@/components/common/StyledMessage'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Link } from '@/components/material/Link'

import { useToggle } from '@/hooks/toggle'
import { useChangeStudyGuidanceGroupTagsMutation } from '@/redux/studyGuidanceGroups'
import { useFilteredAndFormattedStudyProgrammes } from '@/redux/studyProgramme'

import { GroupsWithTags } from '@oodikone/shared/types/studyGuidanceGroup'
import { StyledTable } from '../material/StyledTable'
import { EnrollmentDateSelector } from '../PopulationSearch/EnrollmentDateSelector'
import { startYearToAcademicYear } from './utils'

type FormattedProgrammes = ReturnType<typeof useFilteredAndFormattedStudyProgrammes>

const LinkToGroup = ({ group }: { group: GroupsWithTags }) => {
  const { getTextIn } = useLanguage()
  const destination = `/studyguidancegroups/${group.id}`
  return (
    <Link data-cy={`study-guidance-group-link-${group.id}`} sx={{ color: 'text.primary' }} to={destination}>
      <Typography sx={{ display: 'flex' }}>
        {getTextIn(group.name)}
        <ArrowIcon color="primary" />
      </Typography>
    </Link>
  )
}

const addText = (tagName: string) => {
  if (tagName === 'studyProgramme') return 'Add degree programme'
  return 'Add starting year'
}

const EditTagModal = ({
  group,
  open,
  selectFieldItems,
  tagName,
  toggleEdit,
  initialState,
}: {
  group: GroupsWithTags
  open: boolean
  selectFieldItems: FormattedProgrammes | undefined // Unset for tagName 'year'
  tagName: 'year' | 'studyProgramme'
  toggleEdit: () => void
  initialState: any
}) => {
  const [changeStudyGuidanceGroupTags, { isLoading }] = useChangeStudyGuidanceGroupTagsMutation()
  const { getTextIn } = useLanguage()
  const [formValues, setFormValues] = useState({ [tagName]: initialState ?? '' })
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    setFormValues({ [tagName]: initialState ?? '' })
    setFormErrors({})
  }, [group, tagName, open])

  const validate = values => {
    const tags = { studyProgramme: 'Degree programme', year: 'Starting year' }
    const errors = {}
    if (!values[tagName]) {
      errors[tagName] = `${tags[tagName]} is required!`
    }
    return errors
  }

  const handleChange = (name, value) => {
    setFormValues(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    const errors = validate(formValues)
    setFormErrors(errors)

    if (Object.keys(errors).length === 0) {
      void changeStudyGuidanceGroupTags({ groupId: group.id, tags: formValues })
      toggleEdit()
    }
  }

  const handleRemove = () => {
    void changeStudyGuidanceGroupTags({ groupId: group.id, tags: { [tagName]: null } })
    toggleEdit()
  }

  return (
    <Dialog fullWidth onClose={toggleEdit} open={open}>
      <Paper sx={{ p: 2 }}>
        <Typography sx={{ mb: 1 }} variant="h6">
          {getTextIn(group.name)}
        </Typography>
        <Paper sx={{ p: 2 }} variant="outlined">
          <Box>
            <p>
              {tagName === 'studyProgramme'
                ? 'Edit associated degree programme for this group:'
                : 'Edit associated starting year for this group:'}
            </p>
            <Box>
              {tagName === 'studyProgramme' ? (
                <FormControl fullWidth>
                  <InputLabel>Select degree programme</InputLabel>
                  <Select
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: '40vh',
                        },
                      },
                    }}
                    fullWidth
                    label="Select degree programme"
                    name={tagName}
                    onChange={event => handleChange(tagName, event.target.value)}
                    value={formValues[tagName] ?? undefined}
                  >
                    {selectFieldItems?.map(({ key, value, description, text }) => (
                      <MenuItem key={key} sx={{ justifyContent: 'space-between' }} value={value}>
                        <Typography sx={{ mr: 1 }}>{text}</Typography>
                        <Typography fontWeight="lighter">{description}</Typography>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <EnrollmentDateSelector
                    setYear={value => handleChange(tagName, value)}
                    // Magic number: previous year (if none set)
                    year={formValues[tagName] === '' ? new Date().getFullYear() - 1 : Number(formValues[tagName])}
                  />
                </Box>
              )}
            </Box>
            {formErrors[tagName] ? (
              <Alert severity="error" variant="outlined">
                {formErrors[tagName]}
              </Alert>
            ) : null}
          </Box>
        </Paper>
        <Stack direction="row" justifyContent="space-between" mt={2} spacing={1}>
          <Button onClick={toggleEdit} variant="text">
            Cancel
          </Button>
          <div>
            <Button
              color="error"
              disabled={isLoading || !group.tags?.[tagName]}
              endIcon={<DeleteIcon />}
              onClick={handleRemove}
              sx={{ mr: 1 }}
              variant="contained"
            >
              Clear
            </Button>
            <Button
              color="primary"
              disabled={isLoading}
              endIcon={<SaveIcon />}
              onClick={handleSave}
              variant="contained"
            >
              Save
            </Button>
          </div>
        </Stack>
      </Paper>
    </Dialog>
  )
}

const TagCell = ({
  group,
  degreeProgrammes,
  tagName,
}: {
  group: GroupsWithTags
  degreeProgrammes?: FormattedProgrammes
  tagName: 'year' | 'studyProgramme'
}) => {
  const [showEdit, toggleEdit] = useToggle()

  const getText = () => {
    switch (tagName) {
      case 'studyProgramme':
        return degreeProgrammes?.find(programme => programme.value === group.tags?.studyProgramme)?.text
      case 'year':
        return startYearToAcademicYear(group.tags?.year)
      default:
        throw Error(`Unexpected tagName: ${tagName}`)
    }
  }

  return (
    <>
      <EditTagModal
        group={group}
        initialState={group.tags?.[tagName]}
        open={showEdit}
        selectFieldItems={degreeProgrammes}
        tagName={tagName}
        toggleEdit={toggleEdit}
      />

      {group.tags?.[tagName] ? (
        <Stack alignItems="center" direction="row" justifyContent="space-between">
          <Typography pr={2}>{getText()}</Typography>
          <Button endIcon={<ModeIcon />} onClick={toggleEdit} size="small" sx={{ height: '2.4em' }} variant="outlined">
            Edit
          </Button>
        </Stack>
      ) : (
        <Button onClick={toggleEdit} size="small" startIcon={<AddIcon />} variant="outlined">
          {addText(tagName)}
        </Button>
      )}
    </>
  )
}

export const StudyGuidanceGroupOverview = ({ groups }: { groups: GroupsWithTags[] }) => {
  const degreeProgrammes = useFilteredAndFormattedStudyProgrammes()

  if (groups.length === 0) {
    return <StyledMessage>You do not have access to any study guidance groups.</StyledMessage>
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <StyledMessage sx={{ mt: '1em', mb: '2em' }}>
        <p>
          Tällä sivulla pääset tarkastemaan ohjattavien opiskelijoidesi etenemistä ohjausryhmittäin. Voit halutessasi
          lisätä ohjausryhmään aloitusvuoden ja koulutusohjelman, jolloin yksittäisen ohjausryhmän näkymään avautuu
          lisäominaisuuksia.
        </p>
        <p>
          <Link to="/close-to-graduation">Tässä näkymässä</Link> voit tarkastella ohjausryhmiesi lähellä valmistumista
          olevia opiskelijoita.
        </p>
      </StyledMessage>
      <StyledTable data-cy="study-guidance-group-overview-data-table" showCellBorders>
        <TableHead>
          <TableRow>
            <TableCell>Group name</TableCell>
            <TableCell>Students</TableCell>
            <TableCell>Associated degree programme</TableCell>
            <TableCell>Associated starting academic year</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {groups.map(group => (
            <TableRow key={group.id}>
              <TableCell>
                <LinkToGroup group={group} />
              </TableCell>
              <TableCell>{group.members.length ?? 0}</TableCell>
              <TableCell>
                <TagCell degreeProgrammes={degreeProgrammes} group={group} tagName="studyProgramme" />
              </TableCell>
              <TableCell>
                <TagCell group={group} tagName="year" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </StyledTable>
    </Box>
  )
}
