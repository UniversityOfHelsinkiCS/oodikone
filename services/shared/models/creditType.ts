import type { Name } from '../types'
import { CreditTypeCode } from '../types'

export type CreditType = {
  credittypecode: CreditTypeCode
  name: Required<Name>
  createdAt: Date
  updatedAt: Date
}
