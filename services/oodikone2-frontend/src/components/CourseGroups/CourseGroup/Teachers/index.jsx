import React, { Fragment, Component } from 'react'
import { Header, List, Button, Radio, Icon } from 'semantic-ui-react'
import sortBy from 'lodash/sortBy'
import { bool, func, arrayOf, number } from 'prop-types'
import { teacherType } from '../util'

import '../courseGroup.css'

const teacherColumnTypes = {
  NAME: 'name',
  CODE: 'code',
  COURSES: 'courses',
  CREDITS: 'credits'
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
  isActive: bool.isRequired
}

class Index extends Component {
  static propTypes = {
    activeTeacherIds: arrayOf(number).isRequired,
    handleFilterClick: func.isRequired,
    handleActiveToggleChange: func.isRequired,
    showOnlyActiveTeachers: bool.isRequired
  }

  state = {
    viewableTeachers: [],
    sortColumn: teacherColumnTypes.NAME,
    sortReverse: false,
    activeTeacherCount: 0
  }

  static getDerivedStateFromProps(props) {
    const { teachers, showOnlyActiveTeachers, activeTeacherIds } = props

    const activeTeachers = teachers.filter(t => activeTeacherIds.includes(t.id))

    return {
      activeTeacherCount: activeTeachers.length,
      viewableTeachers: showOnlyActiveTeachers ? activeTeachers : teachers
    }
  }

  handleTeacherHeaderClick = columnName => {
    const { sortColumn, sortReverse } = this.state
    const isSortColumn = columnName === sortColumn
    this.setState({
      sortColumn: columnName,
      sortReverse: isSortColumn ? !sortReverse : sortReverse
    })
  }

  renderListHeader = () => {
    const { sortColumn, sortReverse } = this.state

    const getHeader = (className, label, columnName) => {
      const isActive = columnName === sortColumn

      return (
        <div className={className} onClick={() => this.handleTeacherHeaderClick(columnName)}>
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

  render() {
    const { handleFilterClick, handleActiveToggleChange, showOnlyActiveTeachers, activeTeacherIds } = this.props
    const { viewableTeachers, activeTeacherCount, sortColumn, sortReverse } = this.state

    const toggleId = 'toggle'
    const sortedTeachers = sortBy(viewableTeachers, sortColumn)

    if (sortReverse) {
      sortedTeachers.reverse()
    }

    return (
      <Fragment>
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
          {this.renderListHeader()}
          {sortedTeachers.map(t => {
            const isActive = activeTeacherIds.includes(t.id)
            return <TeacherItem key={t.id} teacher={t} isActive={isActive} handleFilterClick={handleFilterClick} />
          })}
        </List>
      </Fragment>
    )
  }
}

export default Index
