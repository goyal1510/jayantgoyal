"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jayantgoyal/web-ui/card";
import { Button } from "@jayantgoyal/web-ui/button";
import { Input } from "@jayantgoyal/web-ui/input";
import { Label } from "@jayantgoyal/web-ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@jayantgoyal/web-ui/table";
import { Download, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  type PersonalInfo,
  convertToCSV,
  generateDummyData,
} from "./dummy-data";

export default function PersonalInformationFormClient() {
  const [data, setData] = React.useState<PersonalInfo[]>([]);
  const [dummyCount, setDummyCount] = React.useState(12);

  const generateDummyEntries = () => {
    if (dummyCount < 1 || dummyCount > 1000) {
      toast.error("Please enter a number between 1 and 1000");
      return;
    }

    const dummyData = generateDummyData(dummyCount);
    setData((prev) => [...prev, ...dummyData]);
    toast.success(`Generated ${dummyCount} dummy entries`);
  };

  const downloadCSV = () => {
    if (data.length === 0) {
      toast.error("No data to download");
      return;
    }

    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "personal-information.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("CSV file downloaded");
  };

  const clearAll = () => {
    setData([]);
    toast.success("All entries cleared");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dummy Data Generator</CardTitle>
          <CardDescription>
            Generate dummy personal information records
          </CardDescription>
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
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 1 && value <= 1000) {
                  setDummyCount(value);
                }
              }}
              placeholder="Enter number of records (1-1000)"
            />
            <p className="text-xs text-muted-foreground">
              Generate between 1 and 1000 dummy records
            </p>
          </div>
          <Button onClick={generateDummyEntries} className="w-full">
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
              <p>
                No entries yet. Generate dummy data using the generator above.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>First Name</TableHead>
                    <TableHead>Middle Name</TableHead>
                    <TableHead>Last Name</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Date of Birth</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.firstName}</TableCell>
                      <TableCell>{entry.middleName}</TableCell>
                      <TableCell>{entry.lastName}</TableCell>
                      <TableCell>{entry.phoneNumber}</TableCell>
                      <TableCell>{entry.dateOfBirth}</TableCell>
                      <TableCell>{entry.age ?? "-"}</TableCell>
                      <TableCell>{entry.gender}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setData((previous) =>
                              previous.filter((item) => item.id !== entry.id),
                            );
                            toast.success("Entry removed");
                          }}
                          aria-label={`Remove ${entry.firstName} ${entry.lastName}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        No results.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
