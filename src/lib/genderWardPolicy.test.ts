import { describe, expect, it } from 'vitest'
import {
  FEMALE_ONLY_DEPARTMENT_CODES,
  MALE_NURSE_EMPLOYEE_IDS,
  findMaleOnFemaleWardViolations,
} from './genderWardPolicy'

describe('genderWardPolicy', () => {
  const departments = [
    { id: 'd-22a', code: '22A', name_th: 'สามัญอายุรกรรมหญิง 1 (22A)' },
    { id: 'd-22b', code: '22B', name_th: 'สามัญอายุรกรรมชาย 1 (22B)' },
    { id: 'd-18b', code: '18B', name_th: 'สามัญนรีเวชกรรม และศัลยกรรมหญิง (18B)' },
    { id: 'd-20c', code: '20C', name_th: 'สามัญศัลยกรรมชาย (20C)' },
  ]

  const profiles = [
    {
      id: 'legacy-thitiwat',
      full_name: 'ธิติวุฒิ พลเสนา',
      nurse_id: null as string | null,
    },
    {
      id: 'id-thitiwat',
      full_name: 'ธิติวุฒิ พลเสนา',
      nurse_id: '5690573',
    },
    {
      id: 'legacy-nathan',
      full_name: 'ณฐภัทร อินค้า',
      nurse_id: null as string | null,
    },
    {
      id: 'other-nurse',
      full_name: 'สมหญิง ทดสอบ',
      nurse_id: '9999999',
    },
  ]

  it('lists known male employee IDs and female-only ward codes', () => {
    expect(MALE_NURSE_EMPLOYEE_IDS).toEqual(
      expect.arrayContaining(['5690562', '5690573', '5690576', '0000001']),
    )
    expect(FEMALE_ONLY_DEPARTMENT_CODES).toEqual(
      expect.arrayContaining([
        'DR',
        'NICU',
        '18A',
        '18B',
        '19D',
        '22A',
        '22D',
      ]),
    )
  })

  it('flags a male nurse (legacy profile) assigned to 22A', () => {
    const violations = findMaleOnFemaleWardViolations({
      profiles,
      departments,
      assignments: [
        {
          id: 'a1',
          nurse_id: 'legacy-thitiwat',
          department_id: 'd-22a',
        },
      ],
    })

    expect(violations).toHaveLength(1)
    expect(violations[0]).toMatchObject({
      profileId: 'legacy-thitiwat',
      employeeId: '5690573',
      fullName: 'ธิติวุฒิ พลเสนา',
      departmentCode: '22A',
      departmentNameTh: 'สามัญอายุรกรรมหญิง 1 (22A)',
    })
  })

  it('does not flag the same male nurse on a male ward', () => {
    const violations = findMaleOnFemaleWardViolations({
      profiles,
      departments,
      assignments: [
        {
          id: 'a2',
          nurse_id: 'legacy-nathan',
          department_id: 'd-22b',
        },
      ],
    })

    expect(violations).toHaveLength(0)
  })

  it('does not flag other nurses on female-only wards', () => {
    const violations = findMaleOnFemaleWardViolations({
      profiles,
      departments,
      assignments: [
        {
          id: 'a3',
          nurse_id: 'other-nurse',
          department_id: 'd-18b',
        },
      ],
    })

    expect(violations).toHaveLength(0)
  })

  it('matches either employee ID on the profile or known name for male nurses', () => {
    const byId = findMaleOnFemaleWardViolations({
      profiles,
      departments,
      assignments: [
        { id: 'a4', nurse_id: 'id-thitiwat', department_id: 'd-22a' },
      ],
    })
    expect(byId).toHaveLength(1)
    expect(byId[0]?.employeeId).toBe('5690573')
  })
})
