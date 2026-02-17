"use client";

import React from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Autocomplete } from "@/components/ui/Autocomplete";
import { Combobox } from "@/components/ui/Combobox";
import { formatDuration } from "@/lib/utils";
import type { ActiveTimer as ActiveTimerType, Project } from "@/types";

interface ActiveTimerProps {
  activeTimer: ActiveTimerType | null;
  description: string;
  onDescriptionChange: (val: string) => void;
  selectedProjectId: string;
  onProjectChange: (val: string) => void;
  projects: Project[];
  elapsedTime: number;
  onStartStop: () => void;
  taskSuggestions: string[];
}

export const ActiveTimer: React.FC<ActiveTimerProps> = ({
  activeTimer,
  description,
  onDescriptionChange,
  selectedProjectId,
  onProjectChange,
  projects,
  elapsedTime,
  onStartStop,
  taskSuggestions,
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-border p-4 md:p-6 mb-6 md:mb-8 transition-all ${
      activeTimer ? 'sticky top-20 z-10 shadow-lg' : ''
    }`}>
      <div className="flex flex-col gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
          <div className="flex-1 relative">
            <Autocomplete
              placeholder="What are you working on?"
              value={activeTimer?.description || description}
              onValueChange={onDescriptionChange}
              suggestions={taskSuggestions}
              disabled={!!activeTimer}
              maxLength={200}
              className="text-base md:text-lg"
            />
            {!activeTimer && (
              <p className={`text-xs mt-1 sm:mt-0 sm:absolute sm:-bottom-5 sm:left-0 ${
                description.length >= 200 
                  ? "text-red-600 font-semibold" 
                  : description.length >= 180 
                  ? "text-orange-600" 
                  : "text-gray-500"
              }`}>
                {description.length}/200 characters
                {description.length >= 200 && " (maximum reached)"}
              </p>
            )}
          </div>
          <Combobox
            options={[
              { value: "", label: "No Project" },
              ...projects.map((p) => ({
                value: p.id,
                label: p.name,
                color: p.color,
              })),
            ]}
            value={activeTimer?.project_id || selectedProjectId}
            onValueChange={onProjectChange}
            disabled={!!activeTimer}
            placeholder="Select project"
            className="w-full sm:w-64"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-2xl md:text-3xl font-mono font-bold text-gray-900 w-full sm:w-auto text-center sm:text-left">
          {formatDuration(elapsedTime)}
        </div>
        <Button
          onClick={onStartStop}
          variant={activeTimer ? "danger" : "primary"}
          size="lg"
          className="w-full sm:w-auto sm:min-w-32"
          disabled={!activeTimer && !description.trim()}
        >
          {activeTimer ? (
            <>
              <Pause className="h-5 w-5 mr-2" />
              Stop
            </>
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" />
              Start
            </>
          )}
        </Button>
      </div>
      
      {/* Active timer indicator */}
      {activeTimer && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-gray-600">Timer running</span>
            {activeTimer.project_id && (() => {
              const project = projects.find(p => p.id === activeTimer.project_id);
              return project ? (
                <div className="flex items-center gap-2 ml-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="text-gray-700 font-medium">{project.name}</span>
                </div>
              ) : null;
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
