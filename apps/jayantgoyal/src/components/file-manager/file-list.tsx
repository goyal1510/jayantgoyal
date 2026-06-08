"use client"

import { Spinner } from "@/components/ui/spinner"
import { PageSpinner } from "@/components/ui/page-spinner"
import { Card } from "@repo/ui/card"
import { CreateFolderDialog } from "@/components/file-manager/create-folder-dialog"
import { RenameDialog } from "@/components/file-manager/rename-dialog"
import { DeleteDialog } from "@/components/file-manager/delete-dialog"
import { UploadDialog } from "@/components/file-manager/upload-dialog"
import { FileViewer } from "@/components/file-manager/file-viewer"
import { MoveDialog } from "@/components/file-manager/move-dialog"
import { CopyDialog } from "@/components/file-manager/copy-dialog"
import { ShareDialog } from "@/components/file-manager/share-dialog"
import { BulkActionBar } from "@/components/file-manager/bulk-action-bar"
import { BulkDeleteDialog } from "@/components/file-manager/bulk-delete-dialog"
import { BulkMoveDialog } from "@/components/file-manager/bulk-move-dialog"
import { BulkCopyDialog } from "@/components/file-manager/bulk-copy-dialog"
import { FileListToolbar } from "@/components/file-manager/file-list-toolbar"
import { FileGridView } from "@/components/file-manager/file-grid-view"
import { FileListView } from "@/components/file-manager/file-list-view"
import { StorageSummary } from "@/components/file-manager/storage-summary"
import { useFileList } from "@/components/file-manager/use-file-list"

interface FileListProps {
  initialPath?: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function FileList({ initialPath = "/" }: FileListProps) {
  const {
    files,
    selectedFiles,
    selectedIds,
    selectedFileCount,
    selectedFolderCount,
    allVisibleSelected,
    currentPath,
    sortField,
    sortOrder,
    viewMode,
    searchQuery,
    trashMode,
    collectionMode,
    loading,
    storageUsage,
    selectedFile,
    createFolderOpen,
    uploadDialogOpen,
    renameDialogOpen,
    deleteDialogOpen,
    moveDialogOpen,
    copyDialogOpen,
    shareDialogOpen,
    bulkDeleteDialogOpen,
    bulkMoveDialogOpen,
    bulkCopyDialogOpen,
    fileViewerOpen,
    setViewMode,
    setSearchQuery,
    setCollectionMode,
    setCreateFolderOpen,
    setUploadDialogOpen,
    setRenameDialogOpen,
    setDeleteDialogOpen,
    setMoveDialogOpen,
    setCopyDialogOpen,
    setShareDialogOpen,
    setBulkDeleteDialogOpen,
    setBulkMoveDialogOpen,
    setBulkCopyDialogOpen,
    setFileViewerOpen,
    setSelectedFile,
    clearSelection,
    selectAllVisible,
    toggleFileSelection,
    handleItemClick,
    handleRefresh,
    handleRename,
    handleDelete,
    handleMove,
    handleCopy,
    handleShare,
    handleDownload,
    handleBulkDownload,
    handleRestore,
    handlePermanentDelete,
    handleToggleStar,
    handleSortFieldChange,
    handleSortOrderToggle,
    navigateToPath,
  } = useFileList()

  return (
    <div className="space-y-4">
      <FileListToolbar
        currentPath={currentPath}
        sortField={sortField}
        sortOrder={sortOrder}
        viewMode={viewMode}
        searchQuery={searchQuery}
        collectionMode={collectionMode}
        onSortFieldChange={handleSortFieldChange}
        onSortOrderToggle={handleSortOrderToggle}
        onViewModeChange={setViewMode}
        onSearchQueryChange={setSearchQuery}
        onCollectionModeChange={setCollectionMode}
        onUploadClick={() => setUploadDialogOpen(true)}
        onCreateFolderClick={() => setCreateFolderOpen(true)}
        onBreadcrumbClick={navigateToPath}
      />

      <StorageSummary usage={storageUsage} />

      {!trashMode && (
        <BulkActionBar
          selectedCount={selectedFiles.length}
          selectedFileCount={selectedFileCount}
          selectedFolderCount={selectedFolderCount}
          allSelected={allVisibleSelected}
          onSelectAll={selectAllVisible}
          onClearSelection={clearSelection}
          onBulkDownload={handleBulkDownload}
          onBulkMove={() => setBulkMoveDialogOpen(true)}
          onBulkCopy={() => setBulkCopyDialogOpen(true)}
          onBulkDelete={() => setBulkDeleteDialogOpen(true)}
        />
      )}

      {loading && files.length === 0 ? (
        <PageSpinner />
      ) : files.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              {collectionMode === "trash"
                ? "Trash is empty"
                : collectionMode === "recent"
                  ? "No recent files"
                  : collectionMode === "starred"
                    ? "No starred files"
                    : "This folder is empty"}
            </p>
            <p className="text-sm text-muted-foreground">
              {collectionMode === "trash"
                ? "Deleted files and folders will appear here"
                : collectionMode === "recent"
                  ? "Files you update will appear here"
                  : collectionMode === "starred"
                    ? "Star files or folders to keep them here"
                    : "Upload files or create folders to get started"}
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
              selectedIds={selectedIds}
              onItemClick={handleItemClick}
              onSelectionToggle={toggleFileSelection}
              onDownload={handleDownload}
              onRename={handleRename}
              onDelete={handleDelete}
              onMove={handleMove}
              onCopy={handleCopy}
              onShare={handleShare}
              onRestore={handleRestore}
              onPermanentDelete={handlePermanentDelete}
              onToggleStar={handleToggleStar}
              trashMode={trashMode}
            />

            {viewMode === "list" && (
              <FileListView
                files={files}
                selectedIds={selectedIds}
                allVisibleSelected={allVisibleSelected}
                onItemClick={handleItemClick}
                onSelectionToggle={toggleFileSelection}
                onSelectAll={selectAllVisible}
                onClearSelection={clearSelection}
                onDownload={handleDownload}
                onRename={handleRename}
                onDelete={handleDelete}
                onMove={handleMove}
                onCopy={handleCopy}
                onShare={handleShare}
                onRestore={handleRestore}
                onPermanentDelete={handlePermanentDelete}
                onToggleStar={handleToggleStar}
                trashMode={trashMode}
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
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        file={selectedFile}
      />
      <BulkDeleteDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        files={selectedFiles}
        onSuccess={() => {
          clearSelection()
          handleRefresh()
        }}
      />
      <BulkMoveDialog
        open={bulkMoveDialogOpen}
        onOpenChange={setBulkMoveDialogOpen}
        files={selectedFiles}
        onSuccess={() => {
          clearSelection()
          handleRefresh()
        }}
      />
      <BulkCopyDialog
        open={bulkCopyDialogOpen}
        onOpenChange={setBulkCopyDialogOpen}
        files={selectedFiles}
        onSuccess={() => {
          clearSelection()
          handleRefresh()
        }}
      />
      <FileViewer
        open={fileViewerOpen}
        onOpenChange={setFileViewerOpen}
        file={selectedFile}
        files={files}
        onFileChange={setSelectedFile}
      />
    </div>
  )
}
