export { ParsedCourse } from './course'

/** Sets one or more field(s) of an object to optional */
export type SetOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
