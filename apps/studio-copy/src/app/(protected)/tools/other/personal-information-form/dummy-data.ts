import { faker } from "@faker-js/faker"

export type PersonalInfo = {
  id: string
  firstName: string
  middleName: string
  lastName: string
  phoneNumber: string
  dateOfBirth: string
  age: number | null
  gender: string
}

export function calculateAge(dob: string): number | null {
  if (!dob) return null
  const birthDate = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age >= 0 ? age : null
}

export function convertToCSV(data: PersonalInfo[]): string {
  if (data.length === 0) return ""

  const headers = ["First Name", "Middle Name", "Last Name", "Phone Number", "Date of Birth", "Age", "Gender"]
  const rows = data.map(item => [
    item.firstName || "",
    item.middleName || "",
    item.lastName || "",
    item.phoneNumber || "",
    item.dateOfBirth || "",
    item.age !== null ? String(item.age) : "",
    item.gender || "",
  ])

  const escapeCSV = (value: string) => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  return [
    headers.map(escapeCSV).join(","),
    ...rows.map(row => row.map(escapeCSV).join(","))
  ].join("\n")
}

export function generateDummyData(count: number): PersonalInfo[] {
  const dummyData: PersonalInfo[] = []

  for (let i = 0; i < count; i++) {
    const isMale = Math.random() > 0.5
    const gender = isMale ? "Male" : "Female"
    const firstName = faker.person.firstName(isMale ? "male" : "female")
    const middleName = Math.random() > 0.5 ? faker.person.firstName() : ""
    const lastName = faker.person.lastName()
    const areaCode = faker.string.numeric(3)
    const exchange = faker.string.numeric(3)
    const number = faker.string.numeric(4)
    const phoneNumber = `${areaCode}-${exchange}-${number}`
    const dateOfBirth = faker.date.birthdate({ min: 18, max: 80, mode: 'age' })
    const dobString = dateOfBirth.toISOString().split('T')[0]!
    const age = calculateAge(dobString)

    dummyData.push({
      id: crypto.randomUUID(),
      firstName,
      middleName,
      lastName,
      phoneNumber,
      dateOfBirth: dobString,
      age,
      gender,
    })
  }

  return dummyData
}
