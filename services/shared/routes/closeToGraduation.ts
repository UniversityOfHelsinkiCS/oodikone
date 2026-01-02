import { CloseToGraduationData } from './populations'

export type CloseToGraduationResBody = {
  bachelor: CloseToGraduationData[]
  masterAndLicentiate: CloseToGraduationData[]
  // shown only to those with full access to student data
  // see `services/backend/src/routes/coseToGraduation.ts`
  lastUpdated?: string
}
