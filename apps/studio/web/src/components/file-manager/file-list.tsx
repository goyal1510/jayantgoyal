"use client";

import { FolderOpen } from "lucide-react";

import { Spinner } from "@jayantgoyal/web-ui/spinner";
import { PageSpinner } from "@jayantgoyal/web-ui/page-spinner";
import { Card } from "@jayantgoyal/web-ui/card";
import { WorkspaceHeader } from "@jayantgoyal/web-ui/workspace-header";
import { CreateFolderDialog } from "@/components/file-manager/create-folder-dialog";
import { RenameDialog } from "@/components/file-manager/rename-dialog";
import { DeleteDialog } from "@/components/file-manager/delete-dialog";
import { UploadDialog } from "@/components/file-manager/upload-dialog";
import { FileViewer } from "@/components/file-manager/file-viewer";
import { MoveDialog } from "@/components/file-manager/move-dialog";
import { CopyDialog } from "@/components/file-manager/copy-dialog";
import { FileListToolbar } from "@/components/file-manager/file-list-toolbar";
import { FileGridView } from "@/components/file-manager/file-grid-view";
import { FileListView } from "@/components/file-manager/file-list-view";
import { useFileList } from "@/components/file-manager/use-file-list";

interface FileListProps {
  initialPath?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function FileList({ initialPath = "/" }: FileListProps) {
  const {
    files,
    currentPath,
    sortField,
    sortOrder,
    viewMode,
    loading,
    selectedFile,
    createFolderOpen,
    uploadDialogOpen,
    renameDialogOpen,
    deleteDialogOpen,
    moveDialogOpen,
    copyDialogOpen,
    fileViewerOpen,
    setViewMode,
    setCreateFolderOpen,
    setUploadDialogOpen,
    setRenameDialogOpen,
    setDeleteDialogOpen,
    setMoveDialogOpen,
    setCopyDialogOpen,
    setFileViewerOpen,
    setSelectedFile,
    handleItemClick,
    handleRefresh,
    handleRename,
    handleDelete,
    handleMove,
    handleCopy,
    handleDownload,
    handleSortFieldChange,
    handleSortOrderToggle,
    navigateToPath,
  } = useFileList();

  return (
    <div className="space-y-4">
      <WorkspaceHeader
        icon={FolderOpen}
        title="File Manager"
        description="Organize private files and folders, switch views, and keep uploads easy to find."
        tone="blue"
      />

      <FileListToolbar
        currentPath={currentPath}
        sortField={sortField}
        sortOrder={sortOrder}
        viewMode={viewMode}
        onSortFieldChange={handleSortFieldChange}
        onSortOrderToggle={handleSortOrderToggle}
        onViewModeChange={setViewMode}
        onUploadClick={() => setUploadDialogOpen(true)}
        onCreateFolderClick={() => setCreateFolderOpen(true)}
        onBreadcrumbClick={navigateToPath}
      />

      {loading && files.length === 0 ? (
        <PageSpinner />
      ) : files.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">This folder is empty</p>
            <p className="text-sm text-muted-foreground">
              Upload files or create folders to get started
            </p>
          </div>
        </Card>
      ) : (
        <div className="relative">
          {loading && files.length > 0 && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <Spinner size="md" />
            </div>
          )}
          <>
            <FileGridView
              files={files}
              viewMode={viewMode}
              onItemClick={handleItemClick}
              onDownload={handleDownload}
              onRename={handleRename}
              onDelete={handleDelete}
              onMove={handleMove}
              onCopy={handleCopy}
            />

            {viewMode === "list" && (
              <FileListView
                files={files}
                onItemClick={handleItemClick}
                onDownload={handleDownload}
                onRename={handleRename}
                onDelete={handleDelete}
                onMove={handleMove}
                onCopy={handleCopy}
              />
            )}
          </>
        </div>
      )}

      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        parentPath={currentPath}
        onSuccess={handleRefresh}
      />
      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        directoryPath={currentPath}
        onSuccess={handleRefresh}
      />
      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        file={selectedFile}
        onSuccess={handleRefresh}
      />
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        file={selectedFile}
        onSuccess={handleRefresh}
      />
      <MoveDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        file={selectedFile}
        onSuccess={handleRefresh}
      />
      <CopyDialog
        open={copyDialogOpen}
        onOpenChange={setCopyDialogOpen}
        file={selectedFile}
        onSuccess={handleRefresh}
      />
      <FileViewer
        open={fileViewerOpen}
        onOpenChange={setFileViewerOpen}
        file={selectedFile}
        files={files}
        onFileChange={setSelectedFile}
      />
    </div>
  );
}
