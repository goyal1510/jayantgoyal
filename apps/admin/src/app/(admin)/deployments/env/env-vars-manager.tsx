"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Loader2,
  RefreshCw,
  Plus,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
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
import { AddEnvVarDialog, EditEnvVarDialog } from "./env-var-dialogs";
import { EnvVarsTable } from "./env-vars-table";

export function EnvVarsManager() {
  const [project, setProject] = useState<VercelProjectKey>("studio");
  const [envVars, setEnvVars] = useState<VercelEnvVar[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const [addOpen, setAddOpen] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newType, setNewType] = useState("encrypted");
  const [newTargets, setNewTargets] = useState<string[]>(["production", "preview", "development"]);
  const [adding, setAdding] = useState(false);

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
                <SelectItem value="studio">Studio</SelectItem>
                <SelectItem value="admin">Admin App</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Variable
            </Button>
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
            <EnvVarsTable
              envVars={envVars}
              revealedIds={revealedIds}
              toggleReveal={toggleReveal}
              onEdit={(env) => {
                setEditVar(env);
                setEditValue(env.value || "");
              }}
              onDelete={handleDelete}
              actionLoading={actionLoading}
            />
          )}
        </CardContent>
      </Card>

      <AddEnvVarDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        projectLabel={project === "studio" ? "Studio" : "Admin"}
        newKey={newKey}
        setNewKey={setNewKey}
        newValue={newValue}
        setNewValue={setNewValue}
        newType={newType}
        setNewType={setNewType}
        newTargets={newTargets}
        toggleTarget={toggleTarget}
        onSubmit={handleAdd}
        adding={adding}
      />

      <EditEnvVarDialog
        editVar={editVar}
        onClose={() => { setEditVar(null); setEditValue(""); }}
        editValue={editValue}
        setEditValue={setEditValue}
        onSubmit={handleEdit}
        editing={editing}
      />
    </div>
  );
}
