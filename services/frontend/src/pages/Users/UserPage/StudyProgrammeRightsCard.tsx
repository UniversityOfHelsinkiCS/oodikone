import { CheckCircle as CheckCircleIcon, Warning as WarningIcon } from '@mui/icons-material'
import {
  Alert,
  AlertProps,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'

import { createLocaleComparator, isDefaultServiceProvider, isNewStudyProgramme } from '@/common'
import { userToolTips } from '@/common/InfoToolTips'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { FilterOldProgrammesToggle } from '@/components/material/FilterOldProgrammesToggle'
import { InfoBox } from '@/components/material/InfoBox'
import { StatusNotification } from '@/components/material/StatusNotification'
import { useGetProgrammesQuery } from '@/redux/populations'
import { useAddUserUnitsMutation, useRemoveUserUnitsMutation } from '@/redux/users'
import { DetailedProgrammeRights } from '@/shared/types'
import { User } from '@/types/api/users'
import { checkUserAccess } from '@/util/access'
import { EditButton } from './EditButton'

const mapAndSortProgrammes = (programmeRights: DetailedProgrammeRights[], studyProgrammes, getTextIn) => {
  return programmeRights
    .map(({ code, limited }) => {
      const programme = studyProgrammes.find(programme => programme.code === code)
      return { code, name: getTextIn(programme?.name), limited }
    })
    .sort(createLocaleComparator('name'))
}

const getUserFullProgrammeRights = (programmeRights: DetailedProgrammeRights[]) => {
  return programmeRights.filter(programmeRight => !programmeRight.limited).map(programme => programme.code)
}

export const StudyProgrammeRightsCard = ({ user }: { user: User }) => {
  const { id: uid, roles, programmeRights } = user
  const { getTextIn } = useLanguage()
  const [accessRightsToBeAdded, setAccessRightsToBeAdded] = useState<string[]>([])
  const [accessRightsToBeRemoved, setAccessRightsToBeRemoved] = useState<string[]>([])
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: undefined as AlertProps['severity'],
  })
  const [editing, setEditing] = useState(false)
  const [filterOldProgrammes, setFilterOldProgrammes] = useState(true)
  const { data: programmes = {} } = useGetProgrammesQuery()
  const studyProgrammes = Object.values(programmes)
  const [addUserUnitsMutation, addResult] = useAddUserUnitsMutation()
  const [removeUserUnitsMutation, removeResult] = useRemoveUserUnitsMutation()

  useEffect(() => {
    if (addResult.isSuccess || removeResult.isSuccess) {
      setNotification({ open: true, message: 'Access rights updated successfully!', severity: 'success' })
    } else if (addResult.isError || removeResult.isError) {
      setNotification({ open: true, message: 'Failed to update access rights.', severity: 'error' })
    }
  }, [addResult.isSuccess, addResult.isError, removeResult.isSuccess, removeResult.isError])

  let options = studyProgrammes
    .filter(programme => !getUserFullProgrammeRights(programmeRights).includes(programme.code))
    .map(({ code, name }) => ({
      key: code,
      code,
      name: getTextIn(name),
      description: code,
    }))
    .sort(createLocaleComparator('text'))

  if (filterOldProgrammes) {
    options = options.filter(({ code }) => isNewStudyProgramme(code))
  }

  const currentRegularAccessRights = mapAndSortProgrammes(
    programmeRights.filter(({ isIamBased }) => !isIamBased),
    studyProgrammes,
    getTextIn
  )

  const currentIamAccessRights = mapAndSortProgrammes(
    programmeRights.filter(({ isIamBased }) => isIamBased),
    studyProgrammes,
    getTextIn
  )

  const handleSave = async () => {
    if (accessRightsToBeAdded.length > 0) {
      const result = await addUserUnitsMutation({ uid, codes: accessRightsToBeAdded })
      if (!result.error) {
        setAccessRightsToBeAdded([])
      }
    }
    if (accessRightsToBeRemoved.length > 0) {
      const result = await removeUserUnitsMutation({ uid, codes: accessRightsToBeRemoved })
      if (!result.error) {
        setAccessRightsToBeRemoved([])
      }
    }
  }

  const handleEditClick = async () => {
    if (editing) {
      await handleSave()
    }
    setEditing(!editing)
  }

  const hasFullAccess = checkUserAccess(['admin', 'fullSisuAccess'], roles)

  return (
    <>
      <Card sx={{ width: '100%' }} variant="outlined">
        <CardContent>
          <Stack direction="row" justifyContent="space-between">
            <Typography component="h2" variant="h5">
              Study programme rights
            </Typography>
            <EditButton disabled={hasFullAccess} editing={editing} onClick={handleEditClick} />
          </Stack>
        </CardContent>

        <Divider />
        {hasFullAccess ? (
          <Alert severity="info">This user has full access to all study programmes.</Alert>
        ) : (
          <>
            {editing && (
              <CardContent>
                <Typography component="h3" fontWeight="bold" gutterBottom>
                  Select new study programme access rights
                </Typography>
                <Stack direction="column">
                  <FormControl>
                    <InputLabel>Select study programmes to add</InputLabel>
                    <Select
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 300,
                          },
                        },
                      }}
                      data-cy="StudyProgrammeSelector"
                      label="Select study programmes to add"
                      multiple
                      onChange={event => setAccessRightsToBeAdded(event.target.value as string[])}
                      renderValue={selected => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map(value => (
                            <Chip key={value} label={value} />
                          ))}
                        </Box>
                      )}
                      value={accessRightsToBeAdded}
                    >
                      {options.map(({ key, code, name }) => (
                        <MenuItem data-cy={`StudyProgrammeSelectorOption${code}`} key={key} value={code}>
                          <Box display="flex" justifyContent="space-between" width="100%">
                            <Typography color="text.primary" component="span" variant="body1">
                              {name}
                            </Typography>
                            <Typography color="text.secondary" component="span" variant="body1">
                              {code}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FilterOldProgrammesToggle
                    checked={filterOldProgrammes}
                    onChange={() => setFilterOldProgrammes(!filterOldProgrammes)}
                  />
                </Stack>
              </CardContent>
            )}

            <CardContent>
              <Typography component="h3" fontWeight="bold" gutterBottom>
                Current study programme access rights
              </Typography>

              <Stack direction="column" gap={1}>
                {currentRegularAccessRights.length > 0 ? (
                  currentRegularAccessRights.map(({ code, name }) => (
                    <Stack alignItems="center" direction="row" justifyContent="space-between" key={code}>
                      <Typography>{`${name} ${code}`}</Typography>
                      {editing && (
                        <Button
                          color={!accessRightsToBeRemoved.includes(code) ? 'error' : 'primary'}
                          onClick={
                            accessRightsToBeRemoved.includes(code)
                              ? () =>
                                  setAccessRightsToBeRemoved(accessRightsToBeRemoved.filter(right => right !== code))
                              : () => setAccessRightsToBeRemoved([...accessRightsToBeRemoved, code])
                          }
                          size="small"
                          variant="outlined"
                        >
                          {accessRightsToBeRemoved.includes(code) ? 'Cancel removal' : 'Mark for removal'}
                        </Button>
                      )}
                    </Stack>
                  ))
                ) : (
                  <Typography color="text.secondary">No study programme access rights</Typography>
                )}
              </Stack>
            </CardContent>

            {isDefaultServiceProvider() && (
              <CardContent>
                <Stack alignItems="center" direction="row" gap={1}>
                  <Typography component="h3" fontWeight="bold">
                    Current IAM group based study programme access rights
                  </Typography>
                  <InfoBox content={userToolTips.iamGroupBasedAccess} mini />
                </Stack>
                {currentIamAccessRights.length > 0 ? (
                  currentIamAccessRights.map(({ code, name, limited }) => (
                    <Stack direction="row" justifyContent="space-between" key={code}>
                      <Typography>{`${name} ${code}`}</Typography>
                      <Tooltip arrow placement="left" title={limited ? 'Limited rights' : 'Full rights'}>
                        {limited ? <WarningIcon color="warning" /> : <CheckCircleIcon color="success" />}
                      </Tooltip>
                    </Stack>
                  ))
                ) : (
                  <Typography color="text.secondary">No IAM based access rights</Typography>
                )}
              </CardContent>
            )}
          </>
        )}
      </Card>

      <StatusNotification
        message={notification.message}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        open={notification.open}
        severity={notification.severity}
      />
    </>
  )
}
