import { debounce } from 'lodash'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Form, Header, Loader, Message } from 'semantic-ui-react'

import { createLocaleComparator, getUnifiedProgrammeName } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SortableTable } from '@/components/SortableTable'
import { useGetProgrammesQuery } from '@/redux/populations'

const StudyProgrammeFilter = ({ handleFilterChange, studyProgrammes }) => {
  if (studyProgrammes.length <= 10) return null

  return (
    <Form>
      Filter programmes:
      <Form.Input onChange={event => handleFilterChange(event.target.value)} width="4" />
    </Form>
  )
}

const StudyProgrammeLink = ({ linkText, programmeCode }) => (
  <Link style={{ color: 'black' }} to={`/study-programme/${programmeCode}`}>
    {linkText}
  </Link>
)

const StudyProgrammeTable = ({ header, headers, programmes }) => {
  if (programmes == null || programmes.length === 0) return null

  return (
    <>
      <Header>{header}</Header>
      <SortableTable columns={headers} data={programmes} hideHeaderBar />
    </>
  )
}

export const StudyProgrammeSelector = ({ selected }) => {
  const { getTextIn } = useLanguage()
  const { data: programmesAndStudyTracks } = useGetProgrammesQuery()
  const studyProgrammes = Object.values(programmesAndStudyTracks?.programmes || {})
  const [filter, setFilter] = useState('')
  const handleFilterChange = debounce(value => {
    setFilter(value)
  }, 500)
  const bachelorProgrammes = []
  const masterProgrammes = []
  const doctoralProgrammes = []
  const otherProgrammes = []
  const combinedProgrammes = []
  const localeComparator = createLocaleComparator('code')

  if (selected) return null
  if (!studyProgrammes) return <Loader active>Loading</Loader>

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
  ]

  const combinations = { KH90_001: 'MH90_001' }
  const filteredStudyprogrammes = studyProgrammes
    .sort(localeComparator)
    .filter(
      programme =>
        programme.code.toLowerCase().includes(filter.toLocaleLowerCase()) ||
        getTextIn(programme.name).toLowerCase().includes(filter.toLocaleLowerCase()) ||
        (programme.progId && programme.progId.toLowerCase().includes(filter.toLocaleLowerCase()))
    )

  for (const programme of filteredStudyprogrammes) {
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
    <>
      <StudyProgrammeFilter handleFilterChange={handleFilterChange} studyProgrammes={studyProgrammes} />
      <StudyProgrammeTable header="Combined programmes" headers={headers} programmes={combinedProgrammes} />
      <StudyProgrammeTable header="Bachelor programmes" headers={headers} programmes={bachelorProgrammes} />
      <StudyProgrammeTable header="Master programmes" headers={headers} programmes={masterProgrammes} />
      <StudyProgrammeTable header="Doctoral programmes" headers={headers} programmes={doctoralProgrammes} />
      <StudyProgrammeTable header="Other programmes" headers={headers} programmes={otherProgrammes} />
    </>
  )
}
