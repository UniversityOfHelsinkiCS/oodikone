import React from 'react'
import { Redirect } from 'react-router-dom'
import { Segment } from 'semantic-ui-react'

import { useGetTeacherQuery } from 'redux/teachers'
import TeacherDetails from '../TeacherDetails'

export const TeacherPage = ({ teacherId }) => {
  const { data: teacher, isLoading, isError } = useGetTeacherQuery({ id: teacherId })

  if (isLoading) return <Segment basic loading />

  if (isError) return <Redirect to="/teachers" />

  return <TeacherDetails teacher={teacher} />
}
