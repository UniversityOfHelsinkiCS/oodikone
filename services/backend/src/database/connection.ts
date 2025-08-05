import EventEmitter from 'events'
import { Sequelize } from 'sequelize-typescript'
import { SequelizeStorage, Umzug } from 'umzug'

import * as conf from '../config'
import {
  CourseModel,
  CourseProviderModel,
  CourseTypeModel,
  CreditModel,
  CreditTeacherModel,
  CreditTypeModel,
  CurriculumPeriodModel,
  EnrollmentModel,
  OrganizationModel,
  ProgrammeModuleModel,
  ProgrammeModuleChildModel,
  SemesterModel,
  SISStudyRightModel,
  SISStudyRightElementModel,
  StudentModel,
  StudyplanModel,
  StudyrightExtentModel,
  TeacherModel,
} from '../models'
import {
  CustomPopulationSearchModel,
  ExcludedCourseModel,
  OpenUniPopulationSearchModel,
  ProgressCriteriaModel,
  StudyGuidanceGroupTagModel,
  StudyProgrammePinModel,
  TagModel,
  TagStudentModel,
} from '../models/kone'
import { UserModel } from '../models/user'

import logger from '../util/logger'

class DbConnection extends EventEmitter {
  sequelize: Sequelize

  RETRY_ATTEMPTS: number

  established: boolean

  constructor() {
    super()
    this.RETRY_ATTEMPTS = 15
    this.established = false

    this.sequelize = new Sequelize(conf.SIS_DB_URL!, {
      dialect: 'postgres',
      pool: {
        max: 25,
        min: 0,
        acquire: 30000,
        idle: 300000000,
      },
      logging: false,
      password: conf.SIS_PASSWORD,
      models: [
        CourseModel,
        CourseProviderModel,
        CourseTypeModel,
        CreditModel,
        CreditTeacherModel,
        CreditTypeModel,
        CurriculumPeriodModel,
        EnrollmentModel,
        OrganizationModel,
        ProgrammeModuleModel,
        ProgrammeModuleChildModel,
        SemesterModel,
        SISStudyRightModel,
        SISStudyRightElementModel,
        StudentModel,
        StudyplanModel,
        StudyrightExtentModel,
        TeacherModel,
      ],
    })
  }

  async connect(attempt = 1) {
    try {
      await this.sequelize.authenticate()
      this.emit('connect')
      this.established = true
    } catch (error) {
      if (attempt > this.RETRY_ATTEMPTS) {
        this.emit('error', error)
        return
      }
      logger.error({
        message: `Sis database connection failed! Attempt ${attempt}/${this.RETRY_ATTEMPTS}`,
        meta: error,
      })
      setTimeout(() => void this.connect(attempt + 1), 1000 * attempt)
    }
  }
}

// Old-style kone + user db connections
const sequelizeKone = new Sequelize(conf.DB_URL_KONE!, {
  schema: conf.DB_SCHEMA_KONE,
  logging: false,
  password: conf.KONE_PASSWORD,
  models: [
    CustomPopulationSearchModel,
    ExcludedCourseModel,
    OpenUniPopulationSearchModel,
    ProgressCriteriaModel,
    StudyGuidanceGroupTagModel,
    StudyProgrammePinModel,
    TagModel,
    TagStudentModel,
  ],
})

void sequelizeKone.query(`SET SESSION search_path to ${conf.DB_SCHEMA_KONE}`)

const sequelizeUser = new Sequelize(conf.DB_URL_USER!, {
  logging: false,
  password: conf.USER_PASSWORD,
  models: [UserModel],
})

const initializeDatabaseConnection = async () => {
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
  const rounds = 60

  for (const [seq, dbName] of [
    [sequelizeKone, 'kone-db'],
    [sequelizeUser, 'user-db'],
  ] as const) {
    logger.info(`Connecting to ${dbName}...`)
    for (let round = 1; round <= rounds; round++) {
      try {
        await seq.authenticate()
        break
      } catch (error) {
        if (round === rounds) {
          logger.error(`${dbName} database connection failed!`)
          throw error
        }
        await sleep(1000)
      }
    }
    logger.info(`${dbName} database connection established`)

    const schema = dbName === 'kone-db' ? conf.DB_SCHEMA_KONE : undefined
    const migrationsFolder = dbName === 'kone-db' ? 'migrations_kone' : 'migrations_user'
    const migrator = new Umzug({
      storage: new SequelizeStorage({ sequelize: seq, tableName: 'migrations', schema }),
      migrations: {
        glob: `${process.cwd()}${conf.isProduction || conf.isStaging ? '/dist' : ''}/src/database/${migrationsFolder}/*.js`,
      },
      context: seq.getQueryInterface(),
      logger: console,
    })
    try {
      await migrator.up()
      logger.info({ message: `${dbName} migrations up to date` })
    } catch (error) {
      logger.error({ message: `${dbName} migrations failed`, meta: error })
      throw error
    }
  }
}

const dbConnections = new DbConnection()

export { dbConnections, sequelizeKone, sequelizeUser, initializeDatabaseConnection }
