import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { debounce } from 'lodash'
import { arrayOf, string, bool, shape } from 'prop-types'
import { Loader, Message, Header, Form } from 'semantic-ui-react'
import SortableTable from '../../SortableTable'
import useLanguage from '../../LanguagePicker/useLanguage'

const StudyProgrammeSelector = ({ studyprogrammes, selected }) => {
  const [filter, setFilter] = useState('')
  const [bachelorProgrammes, setBachelorProgrammes] = useState([])
  const [masterProgrammes, setMasterProgrammes] = useState([])
  const [doctoralProgrammes, setDoctoralProgrammes] = useState([])
  const [otherProgrammes, setOtherProgrammes] = useState([])
  const [combinedProgrammes, setCombinedProgrammes] = useState([])
  const handleFilterChange = debounce(value => {
    setFilter(value)
  }, 500)

  const { language, getTextIn } = useLanguage()

  useEffect(() => {
    if (studyprogrammes?.length > 0) studyprogrammes.sort((a, b) => (a.code > b.code ? 1 : -1))
  }, [studyprogrammes])

  useEffect(() => {
    if (studyprogrammes) {
      const filteredBachelorProgrammes = []
      const filteredMasterProgrammes = []
      const filtereDoctoralProgrammes = []
      const filteredOtherProgrammes = []
      const filteredCombinedProgrammes = []
      const combinations = { KH90_001: 'MH90_001' }
      const filteredStudyprogrammes = studyprogrammes.filter(programme => {
        if (programme.name[language])
          return (
            programme.code.toLowerCase().includes(filter.toLocaleLowerCase()) ||
            programme.name[language].toLowerCase().includes(filter.toLocaleLowerCase()) ||
            (programme.progId && programme.progId.toLowerCase().includes(filter.toLocaleLowerCase()))
          )
        return (
          programme.code.toLowerCase().includes(filter.toLocaleLowerCase()) ||
          programme.name.fi.toLowerCase().includes(filter.toLocaleLowerCase()) ||
          (programme.progId && programme.progId.toLowerCase().includes(filter.toLocaleLowerCase()))
        )
      })

      filteredStudyprogrammes.forEach(programme => {
        if (programme.code === 'KH90_001') {
          const secondProgrammeCode = combinations[programme.code]
          const secondProgramme = studyprogrammes.filter(programme => programme.code === secondProgrammeCode)
          const combinedName = {
            fi: `${programme.name.fi} ja ${
              secondProgramme[0]?.name.fi?.includes('lisensiaatin')
                ? 'lisensiaatin koulutusojelma'
                : 'maisterin koulutusohjelma'
            }`,
            en: `${programme.name.en.split(' ')[0]} and ${secondProgramme[0]?.name?.en}`,
            sv: `${programme.name.sv.split('programmet')[0]}- och ${secondProgramme[0]?.name?.en}`,
          }

          filteredCombinedProgrammes.push({
            code: programme.code,
            combinedCode: `${programme.code} - ${secondProgramme[0]?.code}`,
            name: combinedName,
            progId: `${programme.progId} - ${secondProgramme[0]?.progId}`,
          })
        } else if (programme.code.includes('MH')) {
          filteredMasterProgrammes.push(programme)
        } else if (programme.code.includes('KH')) {
          filteredBachelorProgrammes.push(programme)
        } else if (/^(T)[0-9]{6}$/.test(programme.code)) {
          filtereDoctoralProgrammes.push(programme)
        } else {
          filteredOtherProgrammes.push(programme)
        }
      })
      setBachelorProgrammes(filteredBachelorProgrammes)
      setMasterProgrammes(filteredMasterProgrammes)
      setDoctoralProgrammes(filtereDoctoralProgrammes)
      setOtherProgrammes(filteredOtherProgrammes)
      setCombinedProgrammes(filteredCombinedProgrammes)
    }
  }, [filter, studyprogrammes])

  if (selected) return null
  if (!studyprogrammes) return <Loader active>Loading</Loader>

  const headers = [
    {
      key: 'programmecode',
      title: 'code',
      getRowVal: prog => (prog.combinedCode ? prog.combinedCode : prog.code),
      getRowContent: prog => (
        <Link
          style={{
            color: 'black',
            display: 'inline-block',
            width: '100%',
            height: '100%',
            padding: '.78571429em .78571429em',
          }}
          to={`/study-programme/${prog.code}`}
        >
          {prog.combinedCode ? prog.combinedCode : prog.code}
        </Link>
      ),
      cellProps: {
        style: {
          padding: '0',
        },
      },
    },
    {
      key: 'programmeId',
      title: 'id',
      getRowVal: prog => prog.progId ?? `${prog.code}-id`,
      getRowContent: prog => (
        <Link
          style={{
            color: 'black',
            display: 'inline-block',
            width: '100%',
            height: '100%',
            padding: '.78571429em .78571429em',
          }}
          to={`/study-programme/${prog.code}`}
        >
          {prog.progId ?? ''}
        </Link>
      ),
      cellProps: {
        style: {
          padding: '0',
        },
      },
    },
    {
      key: 'programmename',
      title: 'name',
      getRowVal: prog => getTextIn(prog.name, language),
      getRowContent: prog => (
        <Link
          style={{
            color: 'black',
            display: 'inline-block',
            width: '100%',
            height: '100%',
            padding: '.78571429em .78571429em',
          }}
          to={`/study-programme/${prog.code}`}
        >
          {getTextIn(prog.name, language)}
        </Link>
      ),
      cellProps: {
        style: {
          padding: '0',
        },
      },
    },
  ]
  if (studyprogrammes == null) {
    return <Message>You do not have access to any programmes</Message>
  }

  return (
    <>
      {studyprogrammes.length > 10 ? (
        <Form>
          Filter programmes:
          <Form.Input onChange={e => handleFilterChange(e.target.value)} width="4" />
        </Form>
      ) : null}
      {combinedProgrammes.length > 0 ? (
        <>
          <Header>Combined programmes</Header>
          <SortableTable
            figure={false}
            columns={headers}
            getRowKey={programme => programme.code}
            data={combinedProgrammes}
          />
        </>
      ) : null}
      {bachelorProgrammes.length > 0 ? (
        <>
          <Header>Bachelor programmes</Header>
          <SortableTable
            figure={false}
            columns={headers}
            getRowKey={programme => programme.code}
            data={bachelorProgrammes}
          />
        </>
      ) : null}
      {masterProgrammes.length > 0 ? (
        <>
          <Header>Master programmes</Header>
          <SortableTable
            figure={false}
            columns={headers}
            getRowKey={programme => programme.code}
            data={masterProgrammes}
          />
        </>
      ) : null}
      {doctoralProgrammes.length > 0 ? (
        <>
          <Header>Doctoral programmes</Header>
          <SortableTable
            figure={false}
            columns={headers}
            getRowKey={programme => programme.code}
            data={doctoralProgrammes}
          />
        </>
      ) : null}
      {otherProgrammes.length > 0 ? (
        <>
          <Header>Specialization programmes and old programmes</Header>
          <SortableTable
            figure={false}
            columns={headers}
            getRowKey={programme => programme.code}
            data={otherProgrammes}
          />
        </>
      ) : null}
    </>
  )
}

StudyProgrammeSelector.propTypes = {
  studyprogrammes: arrayOf(shape({ name: shape({}), code: string })),
  selected: bool.isRequired,
}

StudyProgrammeSelector.defaultProps = {
  studyprogrammes: null,
}

const mapStateToProps = ({ populationProgrammes, settings }) => {
  const { programmes } = populationProgrammes.data
  const { language } = settings

  return {
    studyprogrammes: programmes ? Object.values(programmes) : programmes,
    language,
  }
}

export default connect(mapStateToProps, null)(StudyProgrammeSelector)
