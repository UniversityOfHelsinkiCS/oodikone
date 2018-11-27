import React from 'react'
import { Segment, Header, List, Button } from 'semantic-ui-react'

import styles from './courseGroup.css'

const TeacherItem = ({ teacher, onFilterClickFn }) => {
  const { name, code, id, isActive } = teacher

  const totalCredits = 10
  const totalCourses = 10

  const getStatisticItem = (label, value) => (
    <div className={styles.statisticItem}>
      <div className={styles.statisticLabel}>{label}</div>
      <div className={styles.statisticNumber}>{value}</div>
    </div>
  )

  return (
    <List.Item className={`${isActive ? styles.teacherActiveItem : ''}`}>
      <List.Content className={styles.teacherItemStatistics}>
        <div className={styles.teacherItemBasicInfo}>
          <div className={styles.teacherName}>{name}</div>
          <div className={styles.teacherCode}>{`(${code})`}</div>
        </div>
        {getStatisticItem('Total courses', totalCourses)}
        {getStatisticItem('Total credits', totalCredits)}
        <div className={styles.statisticItem}>
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

const Teachers = ({ teachers, onFilterClickFn }) => (
  <Segment>
    <Header size="medium" content="Teachers" />
    <List celled className={styles.teacherList}>
      {teachers.map(t => <TeacherItem key={t.id} teacher={t} onFilterClickFn={onFilterClickFn} />)}
    </List>
  </Segment>
)

export default Teachers
