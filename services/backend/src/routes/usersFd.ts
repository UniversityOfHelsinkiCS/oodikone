import { Response, Router } from 'express'

import { isDev } from '../config'
import * as auth from '../middleware/auth'
import * as userService from '../services/userService'
import { OodikoneRequest } from '../types'

const router = Router()

interface NewUserEppnRequest extends OodikoneRequest {
  params: {
    newUserEppn: string
  }
}

router.get('/from-sisu-by-eppn/:newUserEppn', auth.roles(['admin']), async (req: NewUserEppnRequest, res: Response) => {
  let { username: requesterEppn } = req.user!
  const { newUserEppn } = req.params
  // In order to test this feature in the dev environment we need to set an eppn that demo sisu will recognize
  if (isDev && requesterEppn === 'mluukkai') {
    requesterEppn = newUserEppn
  }
  const person = await userService.getUserFromSisuByEppn(requesterEppn, newUserEppn)
  res.json(person)
})

interface AddUserRequest extends OodikoneRequest {
  body: {
    user: any // TODO: Funidata, what is the type of user?
  }
}

router.post('/add', auth.roles(['admin']), async (req: AddUserRequest, res: Response) => {
  const { user } = req.body
  const person = await userService.addNewUser(user)
  res.json(person)
})

export default router
