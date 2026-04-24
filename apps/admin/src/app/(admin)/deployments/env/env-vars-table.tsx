"use client";

import {
  Loader2,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import type { VercelEnvVar } from "@/lib/types";

interface EnvVarsTableProps {
  envVars: VercelEnvVar[];
  revealedIds: Set<string>;
  toggleReveal: (id: string) => void;
  onEdit: (envVar: VercelEnvVar) => void;
  onDelete: (envVar: VercelEnvVar) => void;
  actionLoading: string | null;
}

export function EnvVarsTable({
  envVars,
  revealedIds,
  toggleReveal,
  onEdit,
  onDelete,
  actionLoading,
}: EnvVarsTableProps) {
  return (
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
                      onClick={() => onEdit(env)}
                      disabled={isLoading}
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon-sm"
                      onClick={() => onDelete(env)}
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
  );
}
