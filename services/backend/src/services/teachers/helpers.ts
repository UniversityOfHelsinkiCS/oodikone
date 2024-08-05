import { Credit } from '../../models'

export type CreditsWithTeachersForYear = Pick<Credit, 'id' | 'credits' | 'credittypecode' | 'isStudyModule' | 'is_open'>

export const isRegularCourse = (credit: CreditsWithTeachersForYear) => !credit.isStudyModule
