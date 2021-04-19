import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { debounce } from 'lodash'
import { arrayOf, string, bool, shape } from 'prop-types'
import { Loader, Message, Header, Form } from 'semantic-ui-react'
import { getTextIn } from '../../../common'
import SortableTable from '../../SortableTable'

const StudyProgrammeSelector = ({ studyprogrammes, selected, language }) => {
  const [filter, setFilter] = useState('')
  const [bachelorProgrammes, setBachelorProgrammes] = useState([])
  const [masterProgrammes, setMasterProgrammes] = useState([])
  const [otherProgrammes, setOtherProgrammes] = useState([])
  const handleFilterChange = debounce(value => {
    setFilter(value)
  }, 500)

  useEffect(() => {
    if (studyprogrammes) {
      const filteredBachelorProgrammes = []
      const filteredMasterProgrammes = []
      const filteredOtherProgrammes = []

      const filteredStudyprogrammes = studyprogrammes.filter(programme => {
        if (programme.name[language])
          return (
            programme.code.toLowerCase().includes(filter.toLocaleLowerCase()) ||
            programme.name[language].toLowerCase().includes(filter.toLocaleLowerCase())
          )
        return (
          programme.code.toLowerCase().includes(filter.toLocaleLowerCase()) ||
          programme.name.fi.toLowerCase().includes(filter.toLocaleLowerCase())
        )
      })

      filteredStudyprogrammes.forEach(programme => {
        if (programme.code.includes('MH')) {
          filteredMasterProgrammes.push(programme)
        } else if (programme.code.includes('KH')) {
          filteredBachelorProgrammes.push(programme)
        } else {
          filteredOtherProgrammes.push(programme)
        }
      })
      setBachelorProgrammes(filteredBachelorProgrammes)
      setMasterProgrammes(filteredMasterProgrammes)
      setOtherProgrammes(filteredOtherProgrammes)
    }
  }, [filter, studyprogrammes])

  if (selected) return null
  if (!studyprogrammes) return <Loader active>Loading</Loader>

  const headers = [
    {
      key: 'programmecode',
      title: 'code',
      getRowVal: prog => prog.code,
      getRowContent: prog => (
        <Link
          style={{
            color: 'black',
            display: 'inline-block',
            width: '100%',
            height: '100%',
            padding: '.78571429em .78571429em'
          }}
          to={`/study-programme/${prog.code}`}
        >
          {prog.code}
        </Link>
      ),
      cellProps: {
        style: {
          padding: '0'
        }
      }
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
            padding: '.78571429em .78571429em'
          }}
          to={`/study-programme/${prog.code}`}
        >
          {getTextIn(prog.name, language)}
        </Link>
      ),
      cellProps: {
        style: {
          padding: '0'
        }
      }
    }
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
      {bachelorProgrammes.length > 0 ? (
        <>
          <Header>Bachelor programmes</Header>
          <SortableTable columns={headers} getRowKey={programme => programme.code} data={bachelorProgrammes} />
        </>
      ) : null}
      {masterProgrammes.length > 0 ? (
        <>
          <Header>Master programmes</Header>
          <SortableTable columns={headers} getRowKey={programme => programme.code} data={masterProgrammes} />
        </>
      ) : null}

      {otherProgrammes.length > 0 ? (
        <>
          <Header>Doctoral programmes and old programmes</Header>
          <SortableTable columns={headers} getRowKey={programme => programme.code} data={otherProgrammes} />
        </>
      ) : null}
    </>
  )
}

StudyProgrammeSelector.propTypes = {
  studyprogrammes: arrayOf(shape({ name: shape({}), code: string })),
  selected: bool.isRequired,
  language: string.isRequired
}

StudyProgrammeSelector.defaultProps = {
  studyprogrammes: null
}

const mapStateToProps = ({ populationDegreesAndProgrammes, settings }) => {
  const { programmes } = populationDegreesAndProgrammes.data
  const { language } = settings

  return {
    studyprogrammes: programmes ? Object.values(programmes) : programmes,
    language
  }
}

export default connect(mapStateToProps, null)(StudyProgrammeSelector)
