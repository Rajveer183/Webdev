import { describe, expect, it } from 'vitest'
import { FIELD_GROUPS, getPath, parsePages, setPath } from '../pages/admin/contentFields'

describe('content editor helpers', () => {
  it('parses page lists and ranges', () => {
    expect(parsePages('2, 3, 29-31')).toEqual([2, 3, 29, 30, 31])
    expect(parsePages('70, 68–69')).toEqual([68, 69, 70])
    expect(parsePages('two')).toBeNull()
    expect(parsePages('9-3')).toBeNull()
  })

  it('reads and writes nested paths immutably', () => {
    const rec = { title: 'A', certificate: { type: 'completion', eligibility: ['x'] } }
    expect(getPath(rec, 'certificate.eligibility')).toEqual(['x'])
    const next = setPath(rec, 'certificate.eligibility', ['y'])
    expect(next).toEqual({ title: 'A', certificate: { type: 'completion', eligibility: ['y'] } })
    expect(rec.certificate.eligibility).toEqual(['x'])
  })

  it('has a form definition for every content type', () => {
    for (const kind of ['service', 'course', 'article', 'workshop', 'project']) {
      const keys = FIELD_GROUPS[kind].flatMap((g) => g.fields.map((f) => f.key))
      expect(keys).toContain('title')
      expect(keys).toContain('source_pages')
    }
  })
})
