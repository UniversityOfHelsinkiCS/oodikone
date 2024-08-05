/* eslint-disable import/no-cycle */
import { InferAttributes } from 'sequelize'

import { Course } from '../models'

export type CourseWithSubsId = InferAttributes<Course> & { subsId?: number }
