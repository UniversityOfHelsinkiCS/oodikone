import { debounce } from 'lodash'
import { useState } from 'react'
import { Loader, Message, Segment } from 'semantic-ui-react'

import { createLocaleComparator, createPinnedFirstComparator, getUnifiedProgrammeName } from '@/common'
import { FilterOldProgrammesToggle } from '@/components/common/FilterOldProgrammesToggle'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useGetProgrammesQuery } from '@/redux/populations'
import {
  useAddStudyProgrammePinMutation,
  useGetStudyProgrammePinsQuery,
  useRemoveStudyProgrammePinMutation,
} from '@/redux/studyProgrammePins'
import { PinButton } from './PinButton'
import { StudyProgrammeFilter } from './StudyProgrammeFilter'
import { StudyProgrammeLink } from './StudyProgrammeLink'
import { StudyProgrammeTable } from './StudyProgrammeTable'

export const StudyProgrammeSelector = () => {
  const { getTextIn } = useLanguage()
  const { data: programmesAndStudyTracks } = useGetProgrammesQuery()
  const studyProgrammes = Object.values(programmesAndStudyTracks?.programmes || {})
  const [filter, setFilter] = useState('')
  const [otherProgrammesVisible, setOtherProgrammesVisible] = useState(false)
  const handleFilterChange = debounce(value => {
    setFilter(value)
  }, 500)
  const bachelorProgrammes = []
  const masterProgrammes = []
  const doctoralProgrammes = []
  const otherProgrammes = []
  const combinedProgrammes = []
  const localeComparator = createLocaleComparator('code')
  const [addStudyProgrammePins] = useAddStudyProgrammePinMutation()
  const [removeStudyProgrammePins] = useRemoveStudyProgrammePinMutation()
  const { data: studyProgrammePins } = useGetStudyProgrammePinsQuery()
  const pinnedProgrammes = studyProgrammePins?.studyProgrammes || []
  const pinnedFirstComparator = createPinnedFirstComparator(pinnedProgrammes)

  if (!studyProgrammes) return <Loader active>Loading</Loader>

  const isPinned = programmeCode => pinnedProgrammes.includes(programmeCode)

  const headers = [
    {
      key: 'programmeCode',
      title: 'Code',
      getRowVal: programme => programme.combinedCode ?? programme.code,
      getRowContent: programme => (
        <StudyProgrammeLink linkText={programme.combinedCode ?? programme.code} programmeCode={programme.code} />
      ),
    },
    {
      key: 'programmeId',
      title: 'Id',
      getRowVal: programme => programme.progId ?? `${programme.code}-id`,
      getRowContent: programme => (
        <StudyProgrammeLink linkText={programme.progId ?? ''} programmeCode={programme.code} />
      ),
    },
    {
      key: 'programmeName',
      title: 'Name',
      getRowVal: programme => getTextIn(programme.name),
      getRowContent: programme => (
        <StudyProgrammeLink linkText={getTextIn(programme.name)} programmeCode={programme.code} />
      ),
    },
    {
      key: 'pin',
      title: 'Pin',
      sortable: false,
      filterable: false,
      helpText: `
        Click the pin icon to pin/unpin a programme. Pinned programmes are shown first
        here and in the study programme search in Class statistics.
      `,
      getRowVal: programme => programme.code,
      getRowContent: programme => (
        <PinButton
          onClick={isPinned(programme.code) ? removeStudyProgrammePins : addStudyProgrammePins}
          pinned={isPinned(programme.code)}
          programmeCode={programme.code}
        />
      ),
    },
  ]

  const combinations = { KH90_001: 'MH90_001' }
  const filteredStudyProgrammes = studyProgrammes
    .sort(localeComparator)
    .filter(
      programme =>
        programme.code.toLowerCase().includes(filter.toLocaleLowerCase()) ||
        getTextIn(programme.name).toLowerCase().includes(filter.toLocaleLowerCase()) ||
        (programme.progId && programme.progId.toLowerCase().includes(filter.toLocaleLowerCase()))
    )

  for (const programme of filteredStudyProgrammes) {
    if (programme.code === 'KH90_001') {
      const secondProgrammeCode = combinations[programme.code]
      const secondProgramme = studyProgrammes.filter(programme => programme.code === secondProgrammeCode)

      const combinedName = {
        fi: getUnifiedProgrammeName(getTextIn(programme.name, 'fi'), getTextIn(secondProgramme[0]?.name, 'fi'), 'fi'),
        en: getUnifiedProgrammeName(getTextIn(programme.name, 'en'), getTextIn(secondProgramme[0]?.name, 'en'), 'en'),
        sv: getUnifiedProgrammeName(getTextIn(programme.name, 'sv'), getTextIn(secondProgramme[0]?.name, 'sv'), 'sv'),
      }

      combinedProgrammes.push({
        code: `${programme.code}+${secondProgramme[0]?.code}`,
        combinedCode: `${programme.code} - ${secondProgramme[0]?.code}`,
        name: combinedName,
        progId: `${programme.progId} - ${secondProgramme[0]?.progId}`,
      })
    }
    if (programme.code.includes('KH')) {
      bachelorProgrammes.push(programme)
    } else if (programme.code.includes('MH')) {
      masterProgrammes.push(programme)
    } else if (/^(T)[0-9]{6}$/.test(programme.code)) {
      doctoralProgrammes.push(programme)
    } else {
      otherProgrammes.push(programme)
    }
  }

  if (studyProgrammes == null) return <Message>You do not have access to any programmes</Message>

  return (
    <Segment className="contentSegment">
      <StudyProgrammeFilter handleFilterChange={handleFilterChange} studyProgrammes={studyProgrammes} />
      <FilterOldProgrammesToggle
        checked={!otherProgrammesVisible}
        onChange={() => setOtherProgrammesVisible(!otherProgrammesVisible)}
      />
      {studyProgrammes.length > 0 && filteredStudyProgrammes.length === 0 && <Message>No programmes found</Message>}
      <StudyProgrammeTable
        header="Combined programmes"
        headers={headers}
        programmes={combinedProgrammes.sort(pinnedFirstComparator)}
      />
      <StudyProgrammeTable
        header="Bachelor programmes"
        headers={headers}
        programmes={bachelorProgrammes.sort(pinnedFirstComparator)}
      />
      <StudyProgrammeTable
        header="Master programmes"
        headers={headers}
        programmes={masterProgrammes.sort(pinnedFirstComparator)}
      />
      <StudyProgrammeTable
        header="Doctoral programmes"
        headers={headers}
        programmes={doctoralProgrammes.sort(pinnedFirstComparator)}
      />
      <StudyProgrammeTable
        header="Other programmes"
        headers={headers}
        programmes={otherProgrammes.sort(pinnedFirstComparator)}
        visible={otherProgrammesVisible}
      />
    </Segment>
  )
}
