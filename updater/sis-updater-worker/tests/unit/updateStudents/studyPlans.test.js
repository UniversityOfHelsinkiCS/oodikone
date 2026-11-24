import { beforeEach, describe, expect, it, vi } from 'vitest'

const { bulkCreateMock, transactionMock, destroyMock, joinBulkCreateMock } = vi.hoisted(() => ({
  bulkCreateMock: vi.fn(),
  transactionMock: vi.fn(callback => callback('transaction')),
  destroyMock: vi.fn(),
  joinBulkCreateMock: vi.fn(),
}))

vi.mock('@/db/connection.js', () => ({ dbConnections: { sequelize: { transaction: transactionMock } } }))

vi.mock('@/db/index.js', () => ({ selectFromByIds: vi.fn(), bulkCreate: bulkCreateMock }))

vi.mock('@/db/models/index.js', () => ({
  Studyplan: { name: 'Studyplan' },
  StudyplanCourse: { destroy: destroyMock, bulkCreate: joinBulkCreateMock },
}))

vi.mock('@/utils/logger.js', () => ({
  default: { error: vi.fn(), info: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}))

vi.mock('@/updater/shared.js', () => ({
  getEducation: vi.fn(),
  getSemesterByDate: vi.fn(),
  getGrade: vi.fn(),
  getUniOrgId: vi.fn(),
  getCountry: vi.fn(),
  getCreditTypeCodeFromAttainment: vi.fn(),
  educationTypeToExtentcode: {},
}))

import { Studyplan } from '@/db/models/index.js'
import { saveStudyplans } from '@/updater/updateStudents/studyPlans.js'

describe('saveStudyplans', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const insertedRows = () => joinBulkCreateMock.mock.calls[0][0]

  it('replaces the studyplan courses of saved studyplans in one transaction', async () => {
    await saveStudyplans([{ id: 'sp1', included_courses: ['cu1'], includedModules: ['mod1'] }])

    expect(bulkCreateMock).toHaveBeenCalledWith(Studyplan, [
      { id: 'sp1', included_courses: ['cu1'], includedModules: ['mod1'] },
    ])
    expect(destroyMock).toHaveBeenCalledWith({ where: { studyplan_id: ['sp1'] }, transaction: 'transaction' })
    expect(joinBulkCreateMock).toHaveBeenCalledWith(
      [
        { studyplan_id: 'sp1', course_id: 'cu1' },
        { studyplan_id: 'sp1', course_id: 'mod1' },
      ],
      { transaction: 'transaction', ignoreDuplicates: true }
    )
  })

  it('keeps only the last studyplan per id', async () => {
    const first = { id: 'sp1', included_courses: ['cu1'], includedModules: [] }
    const last = { id: 'sp1', included_courses: ['cu2'], includedModules: [] }

    await saveStudyplans([first, last])

    expect(bulkCreateMock).toHaveBeenCalledWith(Studyplan, [last])
    expect(insertedRows()).toEqual([{ studyplan_id: 'sp1', course_id: 'cu2' }])
  })

  it('replaces the studyplan courses of the other studyplans when some fail to save', async () => {
    const failed = { id: 'sp1', included_courses: ['cu1'], includedModules: [] }
    const saved = { id: 'sp2', included_courses: ['cu2'], includedModules: [] }
    const error = new AggregateError([{ entity: failed, error: new Error('upsert failed') }])
    bulkCreateMock.mockRejectedValueOnce(error)

    await expect(saveStudyplans([failed, saved])).rejects.toBe(error)

    expect(destroyMock).toHaveBeenCalledWith({ where: { studyplan_id: ['sp2'] }, transaction: 'transaction' })
    expect(insertedRows()).toEqual([{ studyplan_id: 'sp2', course_id: 'cu2' }])
  })

  it('does not touch studyplan courses when saving fails unexpectedly', async () => {
    const error = new Error('connection lost')
    bulkCreateMock.mockRejectedValueOnce(error)

    await expect(saveStudyplans([{ id: 'sp1', included_courses: ['cu1'], includedModules: [] }])).rejects.toBe(error)

    expect(transactionMock).not.toHaveBeenCalled()
  })

  it('skips the studyplan courses update when there are no studyplans', async () => {
    await saveStudyplans([])

    expect(transactionMock).not.toHaveBeenCalled()
  })
})
