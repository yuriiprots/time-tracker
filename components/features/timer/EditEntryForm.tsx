"use client";

import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Combobox } from "@/components/ui/Combobox";
import { formatDurationForEdit, parseTimeToSeconds } from "@/lib/utils";
import type { TimeEntry, Project } from "@/types";

interface EditEntryFormProps {
  entry: TimeEntry;
  projects: Project[];
  onSave: (updates: Partial<TimeEntry>) => void;
  onCancel: () => void;
}

export const EditEntryForm: React.FC<EditEntryFormProps> = ({
  entry,
  projects,
  onSave,
  onCancel,
}) => {
  const [formState, setFormState] = useState({
    description: entry.description,
    project_id: entry.project_id,
    duration: entry.duration || 0,
  });

  const handleSave = () => {
    onSave(formState);
  };

  return (
    <div className="space-y-3">
      <div>
        <Input
          value={formState.description}
          onChange={(e) =>
            setFormState({ ...formState, description: e.target.value })
          }
          placeholder="Description"
          maxLength={200}
        />
        <p className={`text-xs mt-1 ${
          (formState.description?.length || 0) >= 200 
            ? "text-red-600 font-semibold" 
            : (formState.description?.length || 0) >= 180 
            ? "text-orange-600" 
            : "text-gray-500"
        }`}>
          {formState.description?.length || 0}/200 characters
          {(formState.description?.length || 0) >= 200 && " (maximum reached)"}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Combobox
          options={[
            { value: "", label: "No Project" },
            ...projects.map((p) => ({
              value: p.id,
              label: p.name,
              color: p.color,
            })),
          ]}
          value={formState.project_id || ""}
          onValueChange={(value) =>
            setFormState({ ...formState, project_id: value || null })
          }
          placeholder="Select project"
          className="flex-1"
        />
        <Input
          value={formatDurationForEdit(formState.duration || 0)}
          onChange={(e) =>
            setFormState({
              ...formState,
              duration: parseTimeToSeconds(e.target.value),
            })
          }
          placeholder="HH:MM"
          className="w-28"
        />
        <Button onClick={handleSave} size="sm" variant="primary">
          <Check className="h-4 w-4" />
        </Button>
        <Button onClick={onCancel} size="sm" variant="ghost">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
