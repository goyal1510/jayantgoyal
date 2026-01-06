"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  Mail,
  Lock,
  Trash2,
  Plus,
  Upload,
  CheckCircle2,
  XCircle,
  Info
} from "lucide-react";
import { useProject } from "@/contexts/project-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  phone: string | null;
  phone_confirmed_at: string | null;
  is_anonymous: boolean;
  app_metadata: any;
  user_metadata: any;
  identities: Array<{
    provider: string;
    created_at: string;
    updated_at: string;
  }>;
}

interface UsersResponse {
  users: User[];
  total: number;
}

export default function UsersPage() {
  const { selectedProject } = useProject();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Sheet states
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [createMode, setCreateMode] = useState<"single" | "import">("single"); // Track create mode
  const [showEmailSheet, setShowEmailSheet] = useState(false);
  const [showPasswordSheet, setShowPasswordSheet] = useState(false);
  
  // Selected user for actions
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form states
  const [createFormData, setCreateFormData] = useState({
    email: "",
  });
  const [importEmailsData, setImportEmailsData] = useState("");
  const [emailFormData, setEmailFormData] = useState({
    email: "",
    confirmEmail: "",
  });
  
  // Loading states
  const [createLoading, setCreateLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/users", {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch users");
      }

      const data: UsersResponse = await response.json();
      setUsers(data.users);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setError(null);
    setUsers([]);
    setRowSelection({});
    fetchUsers();
  }, [selectedProject.id]);

  // Generate random 18-character password with digits, special chars, lowercase, and uppercase
  const generatePassword = (): string => {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const digits = "0123456789";
    const specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    const allChars = lowercase + uppercase + digits + specialChars;
    
    let password = "";
    
    // Ensure at least one of each type
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += digits[Math.floor(Math.random() * digits.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];
    
    // Fill the rest randomly
    for (let i = password.length; i < 18; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split("").sort(() => Math.random() - 0.5).join("");
  };

  // Download text file with email and password
  const downloadCredentials = (email: string, password: string, filename: string) => {
    const content = `Email: ${email}\nPassword: ${password}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCreateUser = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+(?:\.[^\s@]+)*$/;
    if (!emailRegex.test(createFormData.email.trim().toLowerCase())) {
      toast.error("Invalid email format");
      return;
    }

    setCreateLoading(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: createFormData.email.trim().toLowerCase() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      // Download credentials file
      if (data.password) {
        const filename = `user_${createFormData.email.trim().toLowerCase().replace("@", "_at_")}_${new Date().getTime()}.txt`;
        downloadCredentials(createFormData.email.trim().toLowerCase(), data.password, filename);
      }

      toast.success(data.message);
      setCreateFormData({ email: "" });
      setShowCreateSheet(false);
      setCreateMode("single"); // Reset to single mode
      await fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleImportUsers = async () => {
    setImportLoading(true);
    try {
      if (!importEmailsData.trim()) {
        throw new Error("Please enter at least one email address");
      }

      // Parse emails from text - support both newline and comma separated
      const emailRegex = /^[^\s@]+@[^\s@]+(?:\.[^\s@]+)*$/;
      const emails = importEmailsData
        .split(/[\n,]+/) // Split by newline or comma
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email.length > 0); // Remove empty strings

      if (emails.length === 0) {
        throw new Error("No valid emails found");
      }

      // Validate email format
      const invalidEmails = emails.filter((email) => !emailRegex.test(email));
      if (invalidEmails.length > 0) {
        throw new Error(`Invalid email format: ${invalidEmails.join(", ")}`);
      }

      // Convert to user objects
      const validatedUsers = emails.map((email) => ({ email }));

      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: validatedUsers }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to import users");
      }

      // Download credentials file for all created users
      if (data.results && data.results.length > 0) {
        const credentials = data.results
          .map((result: any) => `Email: ${result.email}\nPassword: ${result.password}\n`)
          .join("\n---\n\n");
        const blob = new Blob([credentials], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `imported_users_${new Date().getTime()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast.success(data.message);
      setImportEmailsData("");
      setShowCreateSheet(false);
      setCreateMode("single"); // Reset to single mode
      await fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setImportLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (emailFormData.email !== emailFormData.confirmEmail) {
      toast.error("Emails do not match");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+(?:\.[^\s@]+)*$/;
    if (!emailRegex.test(emailFormData.email.trim().toLowerCase())) {
      toast.error("Invalid email format");
      return;
    }

    setEmailLoading(true);
    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser?.id,
          email: emailFormData.email.trim().toLowerCase(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update email");
      }

      toast.success(data.message);
      setEmailFormData({ email: "", confirmEmail: "" });
      setShowEmailSheet(false);
      setSelectedUser(null);
      await fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!selectedUser) return;

    setPasswordLoading(true);
    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          password: true, // Signal to generate password
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      // Download credentials file
      if (data.password && selectedUser.email) {
        const filename = `password_update_${selectedUser.email.replace("@", "_at_")}_${new Date().getTime()}.txt`;
        downloadCredentials(selectedUser.email, data.password, filename);
      }

      toast.success(data.message);
      setShowPasswordSheet(false);
      setSelectedUser(null);
      await fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user ${email}?`)) {
      return;
    }

    try {
      const response = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user");
      }

      toast.success("User deleted successfully");
      await fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDeleteSelected = async () => {
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedIds.length} user(s)?`)) {
      return;
    }

    try {
      const deletePromises = selectedIds.map((userId) =>
        fetch("/api/users", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        })
      );

      const responses = await Promise.all(deletePromises);
      const failedDeletes = [];

      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        if (response && !response.ok) {
          const data = await response.json();
          failedDeletes.push(data.error || "Failed to delete user");
        }
      }

      if (failedDeletes.length > 0) {
        toast.error(`Failed to delete ${failedDeletes.length} user(s)`);
      } else {
        toast.success(`Successfully deleted ${selectedIds.length} user(s)`);
        setRowSelection({});
        await fetchUsers();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  };

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "email",
        header: "User",
        cell: ({ row }: { row: any }) => {
          const user = row.original;
          return (
            <div className="font-medium">{user.email || "No email"}</div>
          );
        },
      },
      {
        accessorKey: "email_confirmed_at",
        header: "Status",
        cell: ({ row }: { row: any }) => {
          const confirmed = !!row.original.email_confirmed_at;
          return (
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                confirmed
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {confirmed ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  Unverified
                </>
              )}
            </span>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ row }: { row: any }) => formatDate(row.getValue("created_at")),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: { row: any }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedUser(user);
                  setEmailFormData({ email: user.email || "", confirmEmail: user.email || "" });
                  setShowEmailSheet(true);
                }}
                title="Update Email"
              >
                <Mail className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedUser(user);
                  setShowPasswordSheet(true);
                }}
                title="Change Password"
              >
                <Lock className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteUser(user.id, user.email || "")}
                title="Delete User"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    []
  );

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-destructive text-xl mb-4">⚠️ Error</div>
          <p className="text-muted-foreground mb-2">{error}</p>
          <p className="text-sm text-muted-foreground mb-4">
            Project: {selectedProject.name}
          </p>
          <Button onClick={() => {
            setError(null);
            fetchUsers();
          }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Users Management</h1>
        </div>
        <div className="flex gap-3">
          {selectedCount > 0 && (
            <Button
              variant="destructive"
              onClick={handleDeleteSelected}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedCount})
            </Button>
          )}
          <Button onClick={() => {
            setCreateMode("single");
            setShowCreateSheet(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Filter by email..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: any) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header: any) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : typeof header.column.columnDef.header === "function"
                        ? header.column.columnDef.header(header.getContext())
                        : header.column.columnDef.header}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row: any) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell: any) => (
                    <TableCell key={cell.id}>
                      {typeof cell.column.columnDef.cell === "function"
                        ? cell.column.columnDef.cell(cell.getContext())
                        : cell.getValue() as React.ReactNode}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <div className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Create User Sheet */}
      <Sheet open={showCreateSheet} onOpenChange={setShowCreateSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {createMode === "single" ? "Create New User" : "Import Users"}
            </SheetTitle>
            <SheetDescription>
              {createMode === "single" 
                ? `Add a new user to ${selectedProject.name}`
                : "Import multiple users at once by entering emails separated by commas or new lines"
              }
            </SheetDescription>
          </SheetHeader>
          
          {/* Mode Toggle */}
          <div className="flex gap-2 p-4 border-b">
            <Button
              variant={createMode === "single" ? "default" : "outline"}
              size="sm"
              onClick={() => setCreateMode("single")}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Single User
            </Button>
            <Button
              variant={createMode === "import" ? "default" : "outline"}
              size="sm"
              onClick={() => setCreateMode("import")}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Emails
            </Button>
          </div>

          <div className="space-y-4 p-4">
            {createMode === "single" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="create-email">Email Address</Label>
                  <Input
                    id="create-email"
                    type="email"
                    placeholder="user@example.com"
                    value={createFormData.email}
                    onChange={(e) =>
                      setCreateFormData({ email: e.target.value })
                    }
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  A random 18-character password will be generated automatically. You will receive a download with the credentials.
                </p>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="import-emails">Email Addresses</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="space-y-2">
                          <p className="font-medium">Email Format:</p>
                          <p className="text-xs">
                            Enter email addresses separated by commas or new lines:
                          </p>
                          <pre className="text-xs whitespace-pre-wrap bg-background/50 p-2 rounded">{`user1@example.com
user2@example.com
user3@example.com

OR

user1@example.com, user2@example.com, user3@example.com`}</pre>
                          <p className="text-xs">
                            Note: Passwords will be auto-generated and included in the download file.
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <textarea
                    id="import-emails"
                    className="w-full min-h-[300px] px-3 py-2 border rounded-md text-sm"
                    placeholder="Enter emails separated by commas or new lines"
                    value={importEmailsData}
                    onChange={(e) => setImportEmailsData(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          <SheetFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateSheet(false);
                setCreateMode("single");
                setCreateFormData({ email: "" });
                setImportEmailsData("");
              }}
            >
              Cancel
            </Button>
            {createMode === "single" ? (
              <Button onClick={handleCreateUser} disabled={createLoading}>
                {createLoading ? "Creating..." : "Create User"}
              </Button>
            ) : (
              <Button
                onClick={handleImportUsers}
                disabled={importLoading || !importEmailsData.trim()}
              >
                {importLoading ? "Importing..." : "Import Users"}
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Update Email Sheet */}
      <Sheet open={showEmailSheet} onOpenChange={setShowEmailSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Update Email</SheetTitle>
            <SheetDescription>
              Update email for {selectedUser?.email}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="email-new">New Email Address</Label>
              <Input
                id="email-new"
                type="email"
                value={emailFormData.email}
                onChange={(e) =>
                  setEmailFormData({ ...emailFormData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-confirm">Confirm New Email</Label>
              <Input
                id="email-confirm"
                type="email"
                value={emailFormData.confirmEmail}
                onChange={(e) =>
                  setEmailFormData({
                    ...emailFormData,
                    confirmEmail: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <SheetFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEmailSheet(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateEmail} disabled={emailLoading}>
              {emailLoading ? "Updating..." : "Update Email"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Change Password Sheet */}
      <Sheet open={showPasswordSheet} onOpenChange={setShowPasswordSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Change Password</SheetTitle>
            <SheetDescription>
              Change password for {selectedUser?.email}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 p-4">
            <p className="text-sm text-muted-foreground">
              A random 18-character password will be generated automatically. You will receive a download with the new credentials.
            </p>
          </div>
          <SheetFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordSheet(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdatePassword} disabled={passwordLoading}>
              {passwordLoading ? "Updating..." : "Update Password"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
