import React, { Fragment, useState, useEffect } from 'react'
import { Header, List, Button, Radio, Icon } from 'semantic-ui-react'
import sortBy from 'lodash/sortBy'
import { bool, func, arrayOf, number, shape } from 'prop-types'
import { teacherType } from '../util'

import '../courseGroup.css'

const teacherColumnTypes = {
  NAME: 'name',
  CODE: 'code',
  COURSES: 'courses',
  CREDITS: 'credits',
}

const TeacherItem = ({ teacher, isActive, handleFilterClick }) => {
  const { name, code, id, courses, credits } = teacher

  return (
    <List.Item className={`${isActive ? 'teacherActiveItem' : ''}`}>
      <List.Content className="teacherItemStatistics">
        <div className="teacherItemBasicInfo">
          <div className="teacherName">{name}</div>
          <div className="teacherCode">{`(${code})`}</div>
        </div>
        <div className="teacherStatisticNumber">{courses}</div>
        <div className="teacherStatisticNumber">{credits}</div>
        <div className="statisticControlItem">
          <Button
            icon="filter"
            className={`${isActive ? 'activeIconButton' : 'iconButton'}`}
            onClick={() => handleFilterClick(id)}
            circular
          />
        </div>
      </List.Content>
    </List.Item>
  )
}

TeacherItem.propTypes = {
  handleFilterClick: func.isRequired,
  teacher: teacherType.isRequired,
  isActive: bool.isRequired,
}

const Index = ({ teachers, showOnlyActiveTeachers, activeTeacherIds, handleFilterClick, handleActiveToggleChange }) => {
  const [viewableTeachers, setViewableTeachers] = useState([])
  const [sortColumn, setSortColumn] = useState(teacherColumnTypes.NAME)
  const [sortReverse, setSortReverse] = useState(false)
  const [activeTeacherCount, setActiveTeacherCount] = useState(0)

  useEffect(() => {
    const activeTeachers = teachers.filter(t => activeTeacherIds.includes(t.id))
    setActiveTeacherCount(activeTeachers.length)
    setViewableTeachers(showOnlyActiveTeachers ? activeTeachers : teachers)
  })

  const handleTeacherHeaderClick = columnName => {
    const isSortColumn = columnName === sortColumn
    setSortColumn(columnName)
    setSortReverse(isSortColumn ? !sortReverse : sortReverse)
  }

  const renderListHeader = () => {
    const getHeader = (className, label, columnName) => {
      const isActive = columnName === sortColumn

      return (
        <div className={className} onClick={() => handleTeacherHeaderClick(columnName)}>
          {label}
          {isActive ? <Icon name={`caret ${sortReverse ? 'down' : 'up'}`} /> : null}
        </div>
      )
    }

    return (
      <List.Header>
        <List.Content className="courseHeaderContent">
          {getHeader('teacherHeaderName', 'Name', teacherColumnTypes.NAME)}
          {getHeader('teacherHeaderItem', 'Courses', teacherColumnTypes.COURSES)}
          {getHeader('teacherHeaderItem', 'Credits', teacherColumnTypes.CREDITS)}
          <div className="teacherHeaderFilter">Filter</div>
        </List.Content>
      </List.Header>
    )
  }

  const toggleId = 'toggle'
  const sortedTeachers = sortBy(viewableTeachers, sortColumn)

  if (sortReverse) {
    sortedTeachers.reverse()
  }

  return (
    <>
      <Header size="medium" className="headerWithControl">
        Teachers
        <div className="activeToggleContainer">
          <label htmlFor={toggleId}>Show only active</label>
          <Radio
            id={toggleId}
            toggle
            checked={showOnlyActiveTeachers}
            onChange={handleActiveToggleChange}
            disabled={activeTeacherCount === 0}
          />
        </div>
      </Header>
      <List celled>
        {renderListHeader()}
        {sortedTeachers.map(t => {
          const isActive = activeTeacherIds.includes(t.id)
          return <TeacherItem key={t.id} teacher={t} isActive={isActive} handleFilterClick={handleFilterClick} />
        })}
      </List>
    </>
  )
}

Index.propTypes = {
  teachers: arrayOf(shape({})).isRequired,
  activeTeacherIds: arrayOf(number).isRequired,
  handleFilterClick: func.isRequired,
  handleActiveToggleChange: func.isRequired,
  showOnlyActiveTeachers: bool.isRequired,
}

export default Index
