import Alert from '@mui/material/Alert'
import Autocomplete from '@mui/material/Autocomplete'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { isNewStudyProgramme } from '@/common'
import { ToggleablePin } from '@/components/common/toggle/ToggleablePin'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { InfoBox } from '@/components/material/InfoBox'
import { useDegreeProgrammeTypes } from '@/hooks/degreeProgrammeTypes'

import { useGetProgrammesQuery } from '@/redux/populations'
import { useGetStudyProgrammePinsQuery } from '@/redux/studyProgrammePins'
import { PopulationSearchProgramme } from '@/types/populationSearch'
import { createPinnedFirstComparator } from '@/util/comparator'

type StudyProgrammeSelectorProps = {
  programme: PopulationSearchProgramme | null
  filterProgrammes: boolean
  showBachelorAndMaster: boolean
  setShowBachelorAndMaster: React.Dispatch<React.SetStateAction<boolean>>
  handleChange: (newProgramme: PopulationSearchProgramme | null) => void
}

export const DegreeProgrammeSelector = ({
  programme,
  filterProgrammes,
  showBachelorAndMaster,
  setShowBachelorAndMaster,
  handleChange,
}: StudyProgrammeSelectorProps) => {
  const { data: programmes = {}, isLoading } = useGetProgrammesQuery()
  const { data: degreeProgrammePins } = useGetStudyProgrammePinsQuery()
  const degreeProgrammeType = useDegreeProgrammeTypes([programme?.code ?? ''])

  const { getTextIn } = useLanguage()

  const pinnedProgrammes = degreeProgrammePins?.studyProgrammes ?? []

  // TODO: make it make sense
  const degreeProgrammes =
    (programmes.KH90_001 || programmes.MH90_001) && !Object.keys(programmes).includes('KH90_001+MH90_001')
      ? {
          ...programmes,
          'KH90_001+MH90_001': {
            ...programmes.KH90_001,
            code: 'KH90_001+MH90_001',
            name: {
              fi: 'Eläinlääketieteen kandiohjelma ja lisensiaatin koulutusohjelma',
              en: "Bachelor's and Degree Programme in Vetenary Medicine",
              sv: 'Kandidats- och Utbildningsprogrammet i veterinärmedicin',
            },
          },
        }
      : programmes

  const bachelorOrMasterProgrammeIsSelected = programme
    ? ['urn:code:degree-program-type:bachelors-degree', 'urn:code:degree-program-type:masters-degree'].includes(
        degreeProgrammeType[programme.code] ?? ''
      )
    : false

  const pinnedFirstComparator = createPinnedFirstComparator(pinnedProgrammes)
  const studyProgrammesAvailable = Object.values(degreeProgrammes).length > 0 && !isLoading

  const programmeOptions: PopulationSearchProgramme[] = studyProgrammesAvailable
    ? Object.values(degreeProgrammes)
        .filter(programme => !filterProgrammes || isNewStudyProgramme(programme.code))
        .map(({ code, name }) => ({
          code,
          name: getTextIn(name),
          pinned: pinnedProgrammes.includes(code),
        }))
        .sort(pinnedFirstComparator)
    : []

  const bachelorAndMasterInfoTooltip = `If you choose a Bachelor's programme, toggling 'Show
    Bachelor + Master' on will also show information about the students' master's studies. If you
    choose a Master's programme, you can see information about the students' bachelor's studies.
    #### This feature is experimental and might still change`

  if (Object.values(degreeProgrammes).length === 0 && !isLoading) {
    return (
      <Alert severity="warning">
        You have no rights to access any data. If you should have access please contact grp-toska@helsinki.fi
      </Alert>
    )
  }

  return (
    <Stack data-cy="population-programme-selector-parent" direction="row" spacing={2}>
      <Autocomplete
        autoComplete
        autoHighlight
        clearOnEscape
        disablePortal
        fullWidth
        getOptionLabel={opt => `${opt.name} - ${opt.code}`}
        onChange={(_, value) => handleChange(value)}
        options={programmeOptions}
        renderInput={params => (
          <TextField
            {...params}
            data-cy="population-programme-selector"
            placeholder="Select degree programme"
            sx={{ p: 0, border: 'none' }}
          />
        )}
        renderOption={(props, option) => {
          const { key, ...optionProps } = props
          return (
            <Stack component="li" direction="row" key={key} spacing={2} sx={{ width: '100%' }} {...optionProps}>
              <ToggleablePin programme={option} />
              <Typography sx={{ flex: 1, p: 0.4 }}>{option.name}</Typography>
              <Typography alignSelf="flex-end" fontWeight="300" sx={{ ml: 2 }} variant="body2">
                {option.code}
              </Typography>
            </Stack>
          )
        }}
        value={programme}
      />
      <FormControlLabel
        control={
          <Switch
            checked={showBachelorAndMaster}
            disabled={!bachelorOrMasterProgrammeIsSelected}
            onChange={() => setShowBachelorAndMaster(prev => !prev)}
          />
        }
        label={
          <Stack direction="row" spacing={1}>
            <Typography sx={{ whiteSpace: 'nowrap' }}>Show Bachelor & Master</Typography>
            <InfoBox content={bachelorAndMasterInfoTooltip} mini />
          </Stack>
        }
      />
    </Stack>
  )
}
