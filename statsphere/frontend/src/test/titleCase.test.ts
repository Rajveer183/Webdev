import { describe, expect, it } from 'vitest'
import { titleCase } from '../lib/titleCase'

describe('titleCase', () => {
  it.each([
    ['Statistical, mathematical and data science consulting', 'Statistical, Mathematical and Data Science Consulting'],
    ['Build practical skill in statistics, mathematics and data science', 'Build Practical Skill in Statistics, Mathematics and Data Science'],
    ['What our certificates mean', 'What Our Certificates Mean'],
    ['Data, variables and graphs', 'Data, Variables and Graphs'],
    ['A worked analysis, end to end', 'A Worked Analysis, End to End'],
    ['Time-series analysis and least-squares fits', 'Time-Series Analysis and Least-Squares Fits'],
    ['Introduction to SQL and R for SGT teams', 'Introduction to SQL and R for SGT Teams'],
    ['Example: the role of $\bar{x}$ in estimation', 'Example: The Role of $\bar{x}$ in Estimation'],
    ['Part of SGT University', 'Part of SGT University'],
    ['Kaplan–Meier and the log-rank test', 'Kaplan–Meier and the Log-Rank Test'],
  ])('%s', (input, expected) => {
    expect(titleCase(input)).toBe(expected)
  })
})
