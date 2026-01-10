"use client"

import * as React from "react"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Download, Trash2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { faker } from "@faker-js/faker"

type PersonalInfo = {
  id: string
  firstName: string
  middleName: string
  lastName: string
  phoneNumber: string
  dateOfBirth: string
  age: number | null
  gender: string
}

function calculateAge(dob: string): number | null {
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

function convertToCSV(data: PersonalInfo[]): string {
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

// Dummy data generator using Faker.js
function generateDummyData(count: number): PersonalInfo[] {
  const dummyData: PersonalInfo[] = []
  
  for (let i = 0; i < count; i++) {
    // Randomly determine gender
    const isMale = Math.random() > 0.5
    const gender = isMale ? "Male" : "Female"
    
    // Generate first name with gender-specific option
    const firstName = faker.person.firstName(isMale ? "male" : "female")
    
    // Generate middle name (50% chance of having one)
    const middleName = Math.random() > 0.5 ? faker.person.firstName() : ""
    
    // Generate last name
    const lastName = faker.person.lastName()
    
    // Generate phone number in clean format: XXX-XXX-XXXX
    // Generate manually to ensure clean format without extensions or parentheses
    const areaCode = faker.string.numeric(3)
    const exchange = faker.string.numeric(3)
    const number = faker.string.numeric(4)
    const phoneNumber = `${areaCode}-${exchange}-${number}`
    
    // Generate date of birth (between 18 and 80 years old)
    const dateOfBirth = faker.date.birthdate({ min: 18, max: 80, mode: 'age' })
    const dobString = dateOfBirth.toISOString().split('T')[0]!
    
    // Calculate age
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

export default function PersonalInformationFormPage() {
  const tool = getToolByPath("/other/personal-information-form")
  const [data, setData] = React.useState<PersonalInfo[]>([])
  const [dummyCount, setDummyCount] = React.useState(12)

  const columns = React.useMemo<ColumnDef<PersonalInfo>[]>(
    () => [
      {
        accessorKey: "firstName",
        header: "First Name",
      },
      {
        accessorKey: "middleName",
        header: "Middle Name",
      },
      {
        accessorKey: "lastName",
        header: "Last Name",
      },
      {
        accessorKey: "phoneNumber",
        header: "Phone Number",
      },
      {
        accessorKey: "dateOfBirth",
        header: "Date of Birth",
      },
      {
        accessorKey: "age",
        header: "Age",
        cell: ({ row }) => {
          const age = row.original.age
          return age !== null ? String(age) : "-"
        },
      },
      {
        accessorKey: "gender",
        header: "Gender",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setData((prev) => prev.filter((item) => item.id !== row.original.id))
                toast.success("Entry removed")
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const generateDummyEntries = () => {
    if (dummyCount < 1 || dummyCount > 1000) {
      toast.error("Please enter a number between 1 and 1000")
      return
    }

    const dummyData = generateDummyData(dummyCount)
    setData((prev) => [...prev, ...dummyData])
    toast.success(`Generated ${dummyCount} dummy entries`)
  }

  const downloadCSV = () => {
    if (data.length === 0) {
      toast.error("No data to download")
      return
    }

    const csv = convertToCSV(data)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "personal-information.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("CSV file downloaded")
  }

  const clearAll = () => {
    setData([])
    toast.success("All entries cleared")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dummy Data Generator</CardTitle>
          <CardDescription>Generate dummy personal information records</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dummyCount">Number of Records</Label>
            <Input
              id="dummyCount"
              type="number"
              min="1"
              max="1000"
              value={dummyCount}
              onChange={(e) => {
                const value = parseInt(e.target.value)
                if (!isNaN(value) && value >= 1 && value <= 1000) {
                  setDummyCount(value)
                }
              }}
              placeholder="Enter number of records (1-1000)"
            />
            <p className="text-xs text-muted-foreground">
              Generate between 1 and 1000 dummy records
            </p>
          </div>
          <Button 
            onClick={generateDummyEntries} 
            className="w-full"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Dummy Data
          </Button>
        </CardContent>
      </Card>

      <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Data Table</CardTitle>
                <CardDescription>
                  {data.length} {data.length === 1 ? "entry" : "entries"}
                </CardDescription>
              </div>
              {data.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={downloadCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAll}>
                    Clear All
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {data.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <p>No entries yet. Generate dummy data using the generator above.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center"
                        >
                          No results.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  )
}
