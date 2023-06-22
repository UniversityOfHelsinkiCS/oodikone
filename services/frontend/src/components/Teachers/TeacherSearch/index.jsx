import React, { useState, useMemo } from 'react'
import { Search, Segment, Icon } from 'semantic-ui-react'
import { func, arrayOf, object, string } from 'prop-types'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import './teacherSearch.css'
import { validateInputLength, splitByEmptySpace } from '../../../common/index'
import Timeout from '../../Timeout'
import { findTeachers } from '../../../redux/teachers'
import SortableTable from '../../SortableTable'

const TeacherSearch = ({ icon, teachers, onClick, setTimeout, clearTimeout, findTeachers }) => {
  const [searchterm, setSearchterm] = useState('')
  const [displayResults, setDisplayResults] = useState(false)

  const resetComponent = () => {
    setSearchterm('')
    setDisplayResults(false)
  }

  const fetchTeachers = searchterm => {
    const trimmedSearchterm = searchterm.trim()
    if (
      !splitByEmptySpace(trimmedSearchterm).find(t => validateInputLength(t, 4)) ||
      (Number(trimmedSearchterm) && trimmedSearchterm.length < 6)
    ) {
      return
    }
    // eslint-disable-next-line no-implied-eval
    setTimeout('fetch', () => {}, 250)
    findTeachers(trimmedSearchterm).then(() => {
      setDisplayResults(true)
      clearTimeout('fetch')
    })
  }

  const handleSearchChange = (e, { value }) => {
    clearTimeout('search')
    if (value.length > 0) {
      setSearchterm(value)
      // eslint-disable-next-line no-implied-eval
      setTimeout(
        'search',
        () => {
          fetchTeachers(value)
        },
        250
      )
    } else {
      resetComponent()
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'name-parent',
        mergeHeader: true,
        merge: true,
        children: [
          {
            key: 'name',
            title: 'Name',
            getRowVal: s => s.name,
            cellProps: row => ({
              onClick: () => onClick(row),
            }),
          },
          {
            key: 'icon',
            getRowContent: () => <Icon name={icon} />,
            export: false,
            cellProps: row => ({
              onClick: () => onClick(row),
            }),
          },
        ],
      },
    ],
    [onClick]
  )

  return (
    <div>
      <div className="searchContainer">
        <Search
          className="searchInput"
          input={{ fluid: true }}
          placeholder="Search by entering a username, id or name"
          value={searchterm}
          onSearchChange={handleSearchChange}
          showNoResults={false}
        />
        {displayResults && (
          <Segment className="contentSegment">
            {teachers.length <= 0 ? (
              <div>No teachers matched your search</div>
            ) : (
              <SortableTable defaultSort={['name', 'desc']} hideHeaderBar columns={columns} data={teachers} />
            )}
          </Segment>
        )}
      </div>
    </div>
  )
}

TeacherSearch.propTypes = {
  setTimeout: func.isRequired,
  clearTimeout: func.isRequired,
  teachers: arrayOf(object).isRequired,
  findTeachers: func.isRequired,
  onClick: func.isRequired,
  icon: string.isRequired,
}

const mapStateToProps = ({ teachers }) => {
  const { list } = teachers
  return {
    teachers: list,
  }
}

export default withRouter(connect(mapStateToProps, { findTeachers })(Timeout(TeacherSearch)))
