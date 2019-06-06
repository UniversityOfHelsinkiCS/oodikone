import { callController } from '../apiConnection/index'

export const GetMandatoryCourseLabels = (programme) => {
  const prefix = 'GET_MANDATORY_COURSE_LABELS_'
  const route = `/mandatory-course-labels/${programme}/labels`
  return callController(route, prefix)
}

export const AddMandatoryCourseLabel = (programme, label) => {
  const prefix = 'ADD_MANDATORY_COURSE_LABELS_'
  const route = `/mandatory-course-labels/${programme}/labels`
  const method = 'post'
  const data = { label }
  return callController(route, prefix, data, method)
}

export const DeleteMandatoryCourseLabel = (programme, label) => {
  const prefix = 'DELETE_MANDATORY_COURSE_LABELS_'
  const route = `/mandatory-course-labels/${programme}/labels`
  const method = 'delete'
  const data = { label }
  return callController(route, prefix, data, method)
}

export const MoveMandatoryCourseLabel = (programme, label, direction) => {
  const prefix = 'MOVE_MANDATORY_COURSE_LABELS_'
  const route = `/mandatory-course-labels/${programme}/move`
  const method = 'post'
  const data = { label, direction }
  return callController(route, prefix, data, method)
}

const reducer = (state = { data: [] }, action) => {
  switch (action.type) {
    case 'GET_MANDATORY_COURSE_LABELS_ATTEMPT':
      return {
        ...state,
        pending: true
      }
    case 'GET_MANDATORY_COURSE_LABELS_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    case 'GET_MANDATORY_COURSE_LABELS_SUCCESS':
      return {
        ...state,
        pending: false,
        error: false,
        data: action.response
      }
    case 'ADD_MANDATORY_COURSE_LABELS_ATTEMPT':
      return {
        ...state,
        pending: true
      }
    case 'ADD_MANDATORY_COURSE_LABELS_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    case 'ADD_MANDATORY_COURSE_LABELS_SUCCESS':
      return {
        ...state,
        pending: false,
        error: false,
        data: action.response
      }
    case 'DELETE_MANDATORY_COURSE_LABELS_ATTEMPT':
      return {
        ...state,
        pending: true
      }
    case 'DELETE_MANDATORY_COURSE_LABELS_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    case 'DELETE_MANDATORY_COURSE_LABELS_SUCCESS':
      return {
        ...state,
        pending: false,
        error: false,
        data: action.response
      }
    case 'MOVE_MANDATORY_COURSE_LABELS_ATTEMPT':
      return {
        ...state,
        pending: true
      }
    case 'MOVE_MANDATORY_COURSE_LABELS_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    case 'MOVE_MANDATORY_COURSE_LABELS_SUCCESS':
      return {
        ...state,
        pending: false,
        error: false,
        data: action.response
      }
    default:
      return state
  }
}

export default reducer
