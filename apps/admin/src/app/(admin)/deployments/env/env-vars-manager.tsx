"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import {
  listEnvVars,
  createEnvVar,
  updateEnvVar,
  deleteEnvVar,
} from "@/lib/vercel-api";
import type { VercelEnvVar, VercelProjectKey } from "@/lib/types";

const ENV_TARGETS = ["production", "preview", "development"] as const;

export function EnvVarsManager() {
  const [project, setProject] = useState<VercelProjectKey>("jg");
  const [envVars, setEnvVars] = useState<VercelEnvVar[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newType, setNewType] = useState("encrypted");
  const [newTargets, setNewTargets] = useState<string[]>(["production", "preview", "development"]);
  const [adding, setAdding] = useState(false);

  // Edit dialog
  const [editVar, setEditVar] = useState<VercelEnvVar | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editing, setEditing] = useState(false);

  const fetchEnvVars = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listEnvVars(project);
      setEnvVars(data);
      setRevealedIds(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to fetch env vars");
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    fetchEnvVars();
  }, [fetchEnvVars]);

  function toggleReveal(id: string) {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleTarget(target: string) {
    setNewTargets((prev) =>
      prev.includes(target) ? prev.filter((t) => t !== target) : [...prev, target]
    );
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newKey || !newValue || newTargets.length === 0) {
      toast.error("Key, value, and at least one target are required");
      return;
    }

    setAdding(true);
    try {
      await createEnvVar(project, {
        key: newKey,
        value: newValue,
        type: newType,
        target: newTargets,
      });
      toast.success(`Created ${newKey}`);
      setAddOpen(false);
      setNewKey("");
      setNewValue("");
      setNewType("encrypted");
      setNewTargets(["production", "preview", "development"]);
      fetchEnvVars();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create env var");
    } finally {
      setAdding(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editVar) return;

    setEditing(true);
    try {
      await updateEnvVar(editVar.id, project, { value: editValue });
      toast.success(`Updated ${editVar.key}`);
      setEditVar(null);
      setEditValue("");
      fetchEnvVars();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update env var");
    } finally {
      setEditing(false);
    }
  }

  async function handleDelete(envVar: VercelEnvVar) {
    if (!confirm(`Delete env var "${envVar.key}"?`)) return;

    setActionLoading(envVar.id);
    try {
      await deleteEnvVar(envVar.id, project);
      toast.success(`Deleted ${envVar.key}`);
      fetchEnvVars();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete env var");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>
              Manage Vercel environment variables
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={project}
              onValueChange={(v) => setProject(v as VercelProjectKey)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jg">Main App</SelectItem>
                <SelectItem value="admin">Admin App</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={addOpen} onOpenChange={(open) => {
              setAddOpen(open);
              if (!open) {
                setNewKey("");
                setNewValue("");
                setNewType("encrypted");
                setNewTargets(["production", "preview", "development"]);
              }
            }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Variable
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleAdd}>
                  <DialogHeader>
                    <DialogTitle>Add Environment Variable</DialogTitle>
                    <DialogDescription>
                      Add a new environment variable to the {project === "jg" ? "Main" : "Admin"} app.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="env-key">Key</Label>
                      <Input
                        id="env-key"
                        placeholder="MY_ENV_VAR"
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        disabled={adding}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="env-value">Value</Label>
                      <Input
                        id="env-value"
                        placeholder="value"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        disabled={adding}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="env-type">Type</Label>
                      <Select value={newType} onValueChange={setNewType} disabled={adding}>
                        <SelectTrigger id="env-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="encrypted">Encrypted</SelectItem>
                          <SelectItem value="plain">Plain</SelectItem>
                          <SelectItem value="sensitive">Sensitive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Targets</Label>
                      <div className="flex gap-2">
                        {ENV_TARGETS.map((t) => (
                          <Button
                            key={t}
                            type="button"
                            variant={newTargets.includes(t) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleTarget(t)}
                            disabled={adding}
                          >
                            {t}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={adding || !newKey || !newValue}>
                      {adding && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Add Variable
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={fetchEnvVars} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : envVars.length === 0 ? (
            <p className="text-sm text-muted-foreground">No environment variables found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Key</th>
                    <th className="pb-3 pr-4 font-medium">Value</th>
                    <th className="pb-3 pr-4 font-medium">Type</th>
                    <th className="pb-3 pr-4 font-medium">Targets</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {envVars.map((env) => {
                    const isLoading = actionLoading === env.id;
                    const isRevealed = revealedIds.has(env.id);

                    return (
                      <tr key={env.id} className="border-b last:border-0">
                        <td className="py-3 pr-4">
                          <span className="font-mono text-xs font-medium">{env.key}</span>
                        </td>
                        <td className="py-3 pr-4 max-w-[200px]">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs truncate">
                              {isRevealed ? env.value : "••••••••"}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => toggleReveal(env.id)}
                              title={isRevealed ? "Hide" : "Reveal"}
                            >
                              {isRevealed ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant="outline">{env.type}</Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex gap-1">
                            {env.target.map((t) => (
                              <Badge key={t} variant="secondary" className="text-xs">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                setEditVar(env);
                                setEditValue(env.value || "");
                              }}
                              disabled={isLoading}
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon-sm"
                              onClick={() => handleDelete(env)}
                              disabled={isLoading}
                              title="Delete"
                            >
                              {isLoading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={!!editVar}
        onOpenChange={(open) => {
          if (!open) {
            setEditVar(null);
            setEditValue("");
          }
        }}
      >
        <DialogContent>
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Edit Environment Variable</DialogTitle>
              <DialogDescription>
                Update the value for <span className="font-mono">{editVar?.key}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-value">Value</Label>
                <Input
                  id="edit-value"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  disabled={editing}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditVar(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={editing || !editValue}>
                {editing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
