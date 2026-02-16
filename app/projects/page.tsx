"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Check, X } from "lucide-react";
import { useTimerStore } from "@/store/useTimerStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Project } from "@/types";

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple (note: using sparingly as per design rules)
  "#ec4899", // pink
  "#f43f5e", // rose
];

export default function ProjectsPage() {
  const { projects, fetchProjects, addProject, updateProject, deleteProject } =
    useTimerStore();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({ name: "", color: PRESET_COLORS[0] });
  const [editForm, setEditForm] = useState<Partial<Project>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Filter projects by search query
  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Paginate filtered projects
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleAddProject = async () => {
    if (!newProject.name.trim()) return;

    await addProject(newProject.name, newProject.color);
    setNewProject({ name: "", color: PRESET_COLORS[0] });
    setIsAdding(false);
  };

  const handleEdit = (project: Project) => {
    setEditingId(project.id);
    setEditForm({
      name: project.name,
      color: project.color,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.name?.trim()) return;

    await updateProject(editingId, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = async (id: string) => {
    if (
      confirm(
        "Are you sure you want to delete this project? This will not delete associated time entries."
      )
    ) {
      await deleteProject(id);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <Button onClick={() => setIsAdding(true)} variant="primary">
          <Plus className="h-5 w-5 mr-2" />
          New Project
        </Button>
      </div>

      {/* Add New Project Form */}
      {isAdding && (
        <div className="bg-white rounded-xl shadow-sm border border-border p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Project</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <Input
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="Enter project name"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewProject({ ...newProject, color })}
                    className={`w-10 h-10 rounded-lg transition-all ${
                      newProject.color === color
                        ? "ring-2 ring-offset-2 ring-gray-900 scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleAddProject} variant="primary">
                Create Project
              </Button>
              <Button onClick={() => setIsAdding(false)} variant="ghost">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {projects.length > 0 && (
        <div className="mb-6">
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          {filteredProjects.length > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Showing {paginatedProjects.length} of {filteredProjects.length} projects
            </p>
          )}
        </div>
      )}

      {/* Projects List */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-border p-8 text-center">
            <p className="text-gray-500">
              {searchQuery
                ? `No projects found matching "${searchQuery}"`
                : "No projects yet. Create your first project!"}
            </p>
          </div>
        ) : (
          paginatedProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-xl shadow-sm border border-border p-6"
            >
              {editingId === project.id ? (
                <div className="space-y-4">
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Project name"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setEditForm({ ...editForm, color })}
                          className={`w-10 h-10 rounded-lg transition-all ${
                            editForm.color === color
                              ? "ring-2 ring-offset-2 ring-gray-900 scale-110"
                              : "hover:scale-105"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleSaveEdit} size="sm" variant="primary">
                      <Check className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button onClick={handleCancelEdit} size="sm" variant="ghost">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg"
                      style={{ backgroundColor: project.color }}
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Created {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => handleEdit(project)} size="sm" variant="ghost">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(project.id)}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            variant="ghost"
            size="sm"
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  currentPage === page
                    ? "bg-primary-600 text-white"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <Button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            variant="ghost"
            size="sm"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
