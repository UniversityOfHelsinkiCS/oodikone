import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import ClearIcon from '@mui/icons-material/Clear'
import DeleteIcon from '@mui/icons-material/Delete'
import ModeIcon from '@mui/icons-material/Mode'
import ArrowIcon from '@mui/icons-material/NorthEast'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Typography from '@mui/material/Typography'

import { useEffect, useState } from 'react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Link } from '@/components/material/Link'
import { SortableTable } from '@/components/SortableTable'
import { DateFormat } from '@/constants/date'
import { useToggle } from '@/hooks/toggle'
import { useChangeStudyGuidanceGroupTagsMutation } from '@/redux/studyGuidanceGroups'
import { useFilteredAndFormattedStudyProgrammes } from '@/redux/studyProgramme'
import { formatDate } from '@/util/timeAndDate'

import { EnrollmentDateSelector } from '../PopulationSearch/EnrollmentDateSelector'
import { startYearToAcademicYear, StyledMessage } from './common'
import './StudyGuidanceGroupOverview.css'

const LinkToGroup = ({ group }) => {
  const { getTextIn } = useLanguage()
  const destination = `/studyguidancegroups/${group.id}`
  return (
    <Link data-cy={`study-guidance-group-link-${group.id}`} sx={{ color: 'black' }} to={destination}>
      <Typography sx={{ display: 'flex' }}>
        {getTextIn(group.name)}
        <ArrowIcon color="primary" />
      </Typography>
    </Link>
  )
}

const prettifyTagName = string => {
  if (string === 'studyProgramme') return 'degree programme'

  return string
}

const EditTagModal = ({ group, open, selectFieldItems, tagName, toggleEdit, initialState }) => {
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
      <Paper sx={{ padding: 2 }}>
        <Typography variant="h6">{getTextIn(group.name)}</Typography>
        <Paper sx={{ padding: 2 }} variant="outlined">
          <AssociateTagForm
            formErrors={formErrors}
            formValues={formValues}
            group={group}
            handleChange={handleChange}
            selectFieldItems={selectFieldItems}
            tagName={tagName}
          />
        </Paper>
        <Box flexDirection="row" sx={{ gap: 0.5, margin: 1, textAlign: 'right' }}>
          <Button color="primary" endIcon={<ClearIcon />} onClick={toggleEdit} variant="outlined">
            Cancel
          </Button>
          <Button
            color="error"
            disabled={isLoading || !group.tags?.[tagName]}
            endIcon={<DeleteIcon />}
            onClick={handleRemove}
            variant="outlined"
          >
            Remove
          </Button>
          <Button color="success" disabled={isLoading} endIcon={<CheckIcon />} onClick={handleSave} variant="outlined">
            Save
          </Button>
        </Box>
      </Paper>
    </Dialog>
  )
}

const AssociateTagForm = ({ formErrors, formValues, group, handleChange, selectFieldItems, tagName }) => (
  <>
    <p>
      {tagName === 'studyProgramme'
        ? 'Edit associated degree programme for this group:'
        : 'Edit associated starting year for this group:'}
    </p>
    <div>
      {tagName === 'studyProgramme' ? (
        <Select
          fullWidth
          name={tagName}
          onChange={event => handleChange(tagName, event.target.value)}
          placeholder={
            selectFieldItems.find(item => item.value === group.tags?.[tagName])?.text ?? 'Select degree programme'
          }
          value={formValues[tagName] ?? '2017'}
        >
          {selectFieldItems.map(({ key, value, description, text }) => (
            <MenuItem key={key} sx={{ justifyContent: 'space-between' }} value={value}>
              <Typography>{text}</Typography>
              <Typography fontWeight="lighter">{description}</Typography>
            </MenuItem>
          ))}
        </Select>
      ) : (
        <EnrollmentDateSelector
          setYear={value => handleChange(tagName, formatDate(new String(value), DateFormat.YEAR_DATE))}
          year={Number(formValues[tagName] ?? 0)}
        />
      )}
    </div>
    {formErrors[tagName] ? (
      <Alert severity="error" variant="outlined">
        {formErrors[tagName]}
      </Alert>
    ) : null}
  </>
)

const TagCell = ({ group, studyProgrammes, tagName }) => {
  const [showEdit, toggleEdit] = useToggle()
  const getText = () => {
    switch (tagName) {
      case 'studyProgramme':
        return studyProgrammes.find(programme => programme.value === group.tags?.[tagName])?.text
      case 'year':
        return startYearToAcademicYear(group.tags?.[tagName])
      default:
        throw Error(`Wrong tagname: ${tagName}`)
    }
  }
  return (
    <>
      <EditTagModal
        group={group}
        initialState={group.tags?.[tagName]}
        open={showEdit}
        selectFieldItems={studyProgrammes}
        tagName={tagName}
        toggleEdit={toggleEdit}
      />
      {group.tags?.[tagName] ? (
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <p style={{ margin: 'auto 1em' }}>{getText()}</p>
          <Button onClick={toggleEdit} size="small" startIcon={<ModeIcon />} variant="outlined" />
        </div>
      ) : (
        <Button onClick={toggleEdit} size="small" startIcon={<AddIcon />} variant="outlined">
          Add {prettifyTagName(tagName)}
        </Button>
      )}
    </>
  )
}

export const StudyGuidanceGroupOverview = ({ groups }) => {
  const { getTextIn } = useLanguage()
  const studyProgrammes = useFilteredAndFormattedStudyProgrammes()

  const headers = [
    {
      key: 'name',
      title: 'Name',
      getRowVal: group => getTextIn(group.name),
      getRowContent: group => <LinkToGroup group={group} />,
    },
    {
      key: 'students',
      title: 'Students',
      filterType: 'range',
      getRowVal: group => group.members?.length ?? 0,
      getRowContent: group => group.members?.length ?? 0,
    },
    {
      key: 'studyProgramme',
      title: 'Degree programme',
      getRowVal: group => group.tags?.studyProgramme,
      formatValue: value => studyProgrammes.find(programme => programme.value === value)?.text,
      getRowContent: group => <TagCell group={group} studyProgrammes={studyProgrammes} tagName="studyProgramme" />,
    },
    {
      key: 'associatedYear',
      title: 'Associated starting academic year',
      getRowVal: group => group.tags?.year,
      formatValue: startYearToAcademicYear,
      getRowContent: group => <TagCell group={group} tagName="year" />,
    },
  ]

  if (groups?.length === 0) {
    return <StyledMessage>You do not have access to any study guidance groups.</StyledMessage>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <StyledMessage style={{ marginBottom: '30px' }}>
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
      <div data-cy="study-guidance-group-overview-data-table" style={{ margin: 'auto' }}>
        <SortableTable columns={headers} data={groups} hideHeaderBar singleLine={false} />
      </div>
    </div>
  )
}
