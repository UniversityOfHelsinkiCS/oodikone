import React, { Fragment, Component } from 'react'
import { Header, List, Button, Radio, Icon } from 'semantic-ui-react'
import sortBy from 'lodash/sortBy'
import { bool, func, shape, string, number } from 'prop-types'

import styles from './courseGroup.css'

const teacherColumnTypes = {
  NAME: 'name',
  CODE: 'code',
  COURSES: 'courses',
  CREDITS: 'credits'
}

const TeacherItem = ({ teacher, onFilterClickFn }) => {
  const { name, code, id, isActive, courses, credits } = teacher

  return (
    <List.Item className={`${isActive ? styles.teacherActiveItem : ''}`}>
      <List.Content className={styles.teacherItemStatistics}>
        <div className={styles.teacherItemBasicInfo}>
          <div className={styles.teacherName}>{name}</div>
          <div className={styles.teacherCode}>{`(${code})`}</div>
        </div>
        <div className={styles.teacherStatisticNumber}>{courses}</div>
        <div className={styles.teacherStatisticNumber}>{credits}</div>
        <div className={styles.statisticControlItem}>
          <Button
            icon="filter"
            className={`${isActive ? styles.activeIconButton : styles.iconButton}`}
            onClick={() => onFilterClickFn(id)}
            circular
          />
        </div>
      </List.Content>
    </List.Item>
  )
}

TeacherItem.propTypes = {
  onFilterClickFn: func.isRequired,
  teacher: shape({
    name: string,
    code: string,
    id: string,
    isActive: bool,
    courses: number,
    credits: number
  }).isRequired
}

class Teachers extends Component {
  static propTypes = {
    onFilterClickFn: func.isRequired,
    onActiveToggleChangeFn: func.isRequired,
    showOnlyActiveTeachers: bool.isRequired
  }

  state = {
    viewableTeachers: [],
    sortColumn: teacherColumnTypes.NAME,
    sortReverse: false,
    activeTeacherCount: 0
  }

  static getDerivedStateFromProps(props) {
    const { teachers, showOnlyActiveTeachers } = props

    const activeTeachers = teachers.filter(t => t.isActive)

    return {
      activeTeacherCount: activeTeachers.length,
      viewableTeachers: showOnlyActiveTeachers ? activeTeachers : teachers
    }
  }

  onTeacherHeaderClick = (columnName) => {
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
        <div
          className={className}
          onClick={() => this.onTeacherHeaderClick(columnName)}
        >
          {label}
          {isActive
            ? <Icon name={`caret ${sortReverse ? 'down' : 'up'}`} />
            : null}
        </div>
      )
    }

    return (
      <List.Header>
        <List.Content className={styles.courseHeaderContent}>
          {getHeader(styles.teacherHeaderName, 'Name', teacherColumnTypes.NAME)}
          {getHeader(styles.teacherHeaderItem, 'Courses', teacherColumnTypes.COURSES)}
          {getHeader(styles.teacherHeaderItem, 'Credits', teacherColumnTypes.CREDITS)}
          <div className={styles.teacherHeaderFilter}>Filter</div>
        </List.Content>
      </List.Header>
    )
  }

  render() {
    const { onFilterClickFn, onActiveToggleChangeFn, showOnlyActiveTeachers } = this.props
    const {
      viewableTeachers,
      activeTeacherCount,
      sortColumn,
      sortReverse
    } = this.state

    const toggleId = 'toggle'
    const sortedTeachers = sortBy(viewableTeachers, sortColumn)

    if (sortReverse) {
      sortedTeachers.reverse()
    }

    return (
      <Fragment>
        <Header size="medium" className={styles.headerWithControl}>
          Teachers
          <div className={styles.activeToggleContainer}>
            <label htmlFor={toggleId}>Show only active</label>
            <Radio
              id={toggleId}
              toggle
              checked={showOnlyActiveTeachers}
              onChange={onActiveToggleChangeFn}
              disabled={activeTeacherCount === 0}
            />
          </div>
        </Header>
        <List celled>
          {this.renderListHeader()}
          {sortedTeachers.map(t =>
            <TeacherItem key={t.id} teacher={t} onFilterClickFn={onFilterClickFn} />)
          }
        </List>
      </Fragment>
    )
  }
}


export default Teachers
