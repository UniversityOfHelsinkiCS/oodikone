import { Queue, FlowProducer, BaseJobOptions } from 'bullmq'
import { redis } from '../config'

const connection = {
  host: redis,
  port: 6379,
}

const defaultJobOptions = {
  attempts: 3,
  removeOnComplete: true,
  removeOnFail: true,
  backoff: {
    type: 'exponential',
    delay: 60 * 1000,
  },
}

/**
 * Pushes jobs to redis for a worker to pick them up
 */
class JobQueue {
  #queue: Queue
  #flowProducer: FlowProducer
  name = 'refresh-redis-data'

  constructor() {
    this.#queue = new Queue(this.name, {
      connection,
      defaultJobOptions,
    })
    this.#flowProducer = new FlowProducer({
      connection,
    })
  }

  #add(type: string, data?: any, jobOpts?: Partial<BaseJobOptions>) {
    // name makes the job unique, and we want uniqueness based on faculty/programme code
    const name = data?.code ? `${type}-${data.code}` : type
    void this.#queue.add(name, { ...data }, { ...jobOpts, jobId: name })
  }

  async clearWaitingJobs() {
    await this.#queue.drain()
  }

  async getJobs() {
    const [waiting, active] = await Promise.all([this.#queue.getWaiting(), this.#queue.getActive()])
    return { waiting, active }
  }

  refreshFaculty(code: string) {
    this.#add('faculty', { code })
  }
  refreshProgramme(code: string) {
    this.#add('programme', { code })
  }
  refreshTeacherLeaderboard() {
    this.#add('teacherLeaderboard')
  }
  refreshLanguagecenter() {
    this.#add('languagecenter')
  }
  refreshStudyplans(days: number) {
    this.#add('studyplansUpdate', { days })
  }
  refreshCloseToGraduation() {
    this.#add('closeToGraduation')
  }

  /** Flow ensures all child jobs (programmes) are processed before the parent (faculty) */
  async addToFlow(facultyCode: string, programmeCodes: string[]) {
    await this.#flowProducer.add({
      name: `faculty-${facultyCode}`,
      data: {
        code: facultyCode,
      },
      queueName: this.name,
      children: programmeCodes.map(programmeCode => ({
        name: `programme-${programmeCode}`,
        data: {
          code: programmeCode,
        },
        queueName: this.name,
        opts: {
          jobId: `programme-${programmeCode}`,
          ...defaultJobOptions,
        },
      })),
      opts: {
        jobId: `faculty-${facultyCode}`,
        ...defaultJobOptions,
      },
    })
  }
}

export const jobQueue = new JobQueue()
