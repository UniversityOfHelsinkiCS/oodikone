import React, { Fragment, Component } from 'react'
import { Header, List, Button, Radio, Icon } from 'semantic-ui-react'
import sortBy from 'lodash/sortBy'

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

class Teachers extends Component {
  state = {
    showOnlyActive: false,
    activeTeacherCount: 0,
    teacherCount: 0,
    viewableTeachers: [],
    sortColumn: teacherColumnTypes.NAME,
    sortReverse: false
  }

  static getDerivedStateFromProps(props, state) {
    const { teachers } = props
    const { showOnlyActive } = state
    const activeTeachers = teachers.filter(t => t.isActive)
    const activeTeacherCount = activeTeachers.length
    const teacherCount = teachers.length
    const resetShowOnlyActive = showOnlyActive && activeTeacherCount === 0

    if (!showOnlyActive || resetShowOnlyActive) {
      return {
        showOnlyActive: false,
        activeTeacherCount,
        teacherCount,
        viewableTeachers: teachers
      }
    }

    return {
      activeTeacherCount,
      teacherCount,
      viewableTeachers: activeTeachers
    }
  }

  onActiveToggleChange = () => {
    const { showOnlyActive } = this.state
    this.setState({ showOnlyActive: !showOnlyActive })
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
            ? <Icon name={`caret ${sortReverse ? 'up' : 'down'}`} />
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
    const { onFilterClickFn } = this.props
    const {
      viewableTeachers,
      activeTeacherCount,
      teacherCount,
      showOnlyActive,
      sortColumn,
      sortReverse
    } = this.state
    const toggleId = 'toggle'
    const sortedTeachers = sortBy(viewableTeachers, [sortColumn])

    if (sortReverse) {
      sortedTeachers.reverse()
    }

    return (
      <Fragment>
        <Header size="medium" className={styles.headerWithControl}>
          <span>Teachers<span className={styles.teacherCount}>{teacherCount}</span></span>
          <div className={styles.activeToggleContainer}>
            <label htmlFor={toggleId}>Show only active</label>
            <Radio
              id={toggleId}
              toggle
              checked={showOnlyActive}
              onChange={this.onActiveToggleChange}
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
