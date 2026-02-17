"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Check, X } from "lucide-react";
import { useTimerStore } from "@/store/useTimerStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectColor, setNewProjectColor] = useState(PRESET_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Project>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    projectId: string | null;
  }>({ isOpen: false, projectId: null });
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
    if (!newProjectName.trim()) return;

    await addProject(newProjectName, newProjectColor);
    setNewProjectName("");
    setNewProjectColor(PRESET_COLORS[0]);
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

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, projectId: id });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.projectId) {
      await deleteProject(deleteConfirm.projectId);
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 max-w-4xl pb-20 md:pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Projects</h1>
        <Button onClick={() => setIsAdding(true)} variant="primary" className="w-full sm:w-auto">
          <Plus className="h-5 w-5 mr-2" />
          New Project
        </Button>
      </div>

      {/* Add New Project Form */}
      {isAdding && (
        <div className="bg-white rounded-xl shadow-sm border border-border p-4 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Project</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <Input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter project name"
                maxLength={50}
                autoFocus
              />
              <p className={`text-xs mt-1 ${
                newProjectName.length >= 50 
                  ? "text-red-600 font-semibold" 
                  : newProjectName.length >= 45 
                  ? "text-orange-600" 
                  : "text-gray-500"
              }`}>
                {newProjectName.length}/50 characters
                {newProjectName.length >= 50 && " (maximum reached)"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewProjectColor(color)}
                    className={`w-10 h-10 rounded-lg transition-all ${
                      newProjectColor === color
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
                    maxLength={50}
                  />
                  <p className={`text-xs mt-1 ${
                    (editForm.name?.length || 0) >= 50 
                      ? "text-red-600 font-semibold" 
                      : (editForm.name?.length || 0) >= 45 
                      ? "text-orange-600" 
                      : "text-gray-500"
                  }`}>
                    {editForm.name?.length || 0}/50 characters
                    {(editForm.name?.length || 0) >= 50 && " (maximum reached)"}
                  </p>

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

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={handleSaveEdit} size="sm" variant="primary" className="w-full sm:w-auto">
                      <Check className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button onClick={handleCancelEdit} size="sm" variant="ghost" className="w-full sm:w-auto">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <div
                      className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate" title={project.name}>
                        {project.name}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-500">
                        Created {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button onClick={() => handleEdit(project)} size="sm" variant="ghost">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => handleDelete(project.id)} size="sm" variant="ghost">
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
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show only relevant pages on mobile (current, first, last, neighbors)
              if (
                totalPages > 7 &&
                window.innerWidth < 640 &&
                page !== 1 &&
                page !== totalPages &&
                Math.abs(currentPage - page) > 1
              ) {
                if (Math.abs(currentPage - page) === 2) return <span key={page}>...</span>;
                return null;
              }
              return (
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
            )})}
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, projectId: null })}
        onConfirm={confirmDelete}
        title="Delete Project"
        message="Are you sure you want to delete this project? This will not delete associated time entries."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
