import { debounce } from 'lodash'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Form, Header, Loader, Message } from 'semantic-ui-react'

import { createLocaleComparator, getUnifiedProgrammeName } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SortableTable } from '@/components/SortableTable'
import { useGetProgrammesQuery } from '@/redux/populations'

const StudyProgrammeLink = ({ programmeCode, linkText }) => (
  <Link style={{ color: 'black' }} to={`/study-programme/${programmeCode}`}>
    {linkText}
  </Link>
)

export const StudyProgrammeSelector = ({ selected }) => {
  const { getTextIn } = useLanguage()
  const { data: programmesAndStudyTracks } = useGetProgrammesQuery()
  const studyprogrammes = Object.values(programmesAndStudyTracks?.programmes || {})
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
  if (!studyprogrammes) return <Loader active>Loading</Loader>

  const headers = [
    {
      key: 'programmecode',
      title: 'code',
      getRowVal: prog => prog.combinedCode ?? prog.code,
      getRowContent: prog => <StudyProgrammeLink linkText={prog.combinedCode ?? prog.code} programmeCode={prog.code} />,
    },
    {
      key: 'programmeId',
      title: 'id',
      getRowVal: prog => prog.progId ?? `${prog.code}-id`,
      getRowContent: prog => <StudyProgrammeLink linkText={prog.progId ?? ''} programmeCode={prog.code} />,
    },
    {
      key: 'programmename',
      title: 'name',
      getRowVal: prog => getTextIn(prog.name),
      getRowContent: prog => <StudyProgrammeLink linkText={getTextIn(prog.name)} programmeCode={prog.code} />,
    },
  ]

  const combinations = { KH90_001: 'MH90_001' }
  const filteredStudyprogrammes = studyprogrammes
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
      const secondProgramme = studyprogrammes.filter(programme => programme.code === secondProgrammeCode)

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

  if (studyprogrammes == null) return <Message>You do not have access to any programmes</Message>

  return (
    <>
      {studyprogrammes.length > 10 && (
        <Form>
          Filter programmes:
          <Form.Input onChange={event => handleFilterChange(event.target.value)} width="4" />
        </Form>
      )}
      {combinedProgrammes.length > 0 && (
        <>
          <Header>Combined programmes</Header>
          <SortableTable columns={headers} data={combinedProgrammes} hideHeaderBar />
        </>
      )}
      {bachelorProgrammes.length > 0 && (
        <>
          <Header>Bachelor programmes</Header>
          <SortableTable columns={headers} data={bachelorProgrammes} hideHeaderBar />
        </>
      )}
      {masterProgrammes.length > 0 && (
        <>
          <Header>Master programmes</Header>
          <SortableTable columns={headers} data={masterProgrammes} hideHeaderBar />
        </>
      )}
      {doctoralProgrammes.length > 0 && (
        <>
          <Header>Doctoral programmes</Header>
          <SortableTable columns={headers} data={doctoralProgrammes} hideHeaderBar />
        </>
      )}
      {otherProgrammes.length > 0 && (
        <>
          <Header>Specialization programmes and old programmes</Header>
          <SortableTable columns={headers} data={otherProgrammes} hideHeaderBar />
        </>
      )}
    </>
  )
}
