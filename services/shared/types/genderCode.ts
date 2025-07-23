export enum GenderCode {
  UNKNOWN = '0',
  MALE = '1',
  FEMALE = '2',
  OTHER = '3',
}

export const GenderCodeToText = {
  0: 'Unknown',
  1: 'Male',
  2: 'Female',
  3: 'Other',
} as const
