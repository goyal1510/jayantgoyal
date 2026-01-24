# Day 10 - File Operations (Rename, Move, Copy)

**Date**: 2026-01-24
**Week**: Week 2
**Status**: ✅ Completed

---

## 📋 Tasks Planned

- [x] Verify rename functionality is working
- [x] Create move file dialog with directory picker
- [x] Implement move file API route
- [x] Create copy file functionality
- [x] Implement copy file API route
- [x] Add context menu for file operations
- [x] Update UI after operations
- [x] Handle conflicts and errors

---

## ✅ Tasks Completed

### Rename Functionality
- Verified rename was already working from Day 7
- Uses PATCH `/api/files/[id]` endpoint
- Updates `file_name`, `file_path`, and `display_name` together

### Move File API
- Created `/api/files/[id]/move/route.ts`
- Validates target path and prevents moving folder into itself
- Returns 409 status with `FILE_EXISTS` code for conflicts
- Supports `overwrite` and `rename` flags for conflict resolution
- Updates `parent_id` along with `file_path` and `file_name`
- Recursively updates child paths when moving directories

### Copy File API
- Created `/api/files/[id]/copy/route.ts`
- Creates new database record with new storage path
- Copies actual file in Supabase Storage
- Returns 409 status with `FILE_EXISTS` code for conflicts
- Handles copy to root directory with correct `parent_id`
- Rollback on storage copy failure

### Directory Picker Component
- Created tree-based folder navigation UI
- Lazy loading of subdirectories on expand
- Excludes source folder and children in move operations
- Visual indicators for selected and expanded states

### Move Dialog Component
- Directory picker for destination selection
- Shows current file name being moved
- Displays target path feedback
- Integrated conflict resolution dialog

### Copy Dialog Component
- Similar to move dialog but for copy operations
- Shows unsupported message for directories
- Conflict resolution with Replace/Cancel/Keep Both options

### Context Menu Integration
- Added Move and Copy options to file context menus
- Both grid and list view context menus updated
- Event propagation properly handled

---

## 🚧 Challenges & Blockers

### Challenge 1: FileViewer Opening on Menu Clicks
- **Issue**: Clicking Move/Copy/Rename/Delete in context menu would also open the FileViewer modal
- **Solution**: Added `e.stopPropagation()` to all menu item click handlers
- **Learnings**: Event bubbling needs to be explicitly stopped when nested elements have their own click handlers

### Challenge 2: Directory Picker Expand Button Triggering Selection
- **Issue**: Clicking the expand/collapse arrow in directory picker would trigger move/copy instead of expanding
- **Solution**: Changed from shadcn `<Button>` to native `<button>` element and added `e.preventDefault()`
- **Learnings**: Some component libraries have internal event handling that can conflict with custom behavior

### Challenge 3: Conflict Handling Pattern
- **Issue**: Initially copy was auto-adding "(copy)" suffix instead of asking user
- **Solution**: Implemented same conflict resolution pattern as upload: Return 409 with FILE_EXISTS, show dialog with Replace/Cancel/Keep Both options
- **Learnings**: Consistent UX patterns across features improve user experience

### Challenge 4: display_name vs file_name Mismatch
- **Issue**: After copy, `display_name` showed "file (copy)" but `file_name`/`file_path` had original name
- **Root Cause**: Old database copy function only updated `display_name`, not `file_name`/`file_path`
- **Solution**: Don't set `display_name` in copy/move operations - let UI fall back to `file_name` for consistency
- **Learnings**: Keep data synchronized; avoid partial updates that cause inconsistencies

### Challenge 5: Move "Keep Both" Not Actually Moving
- **Issue**: When choosing "Keep Both" during move conflict, file was renamed in source location but not moved
- **Root Cause**: `parent_id` was not being updated in the move operation
- **Solution**: Rewrote move API to always fetch new parent directory ID and update `parent_id`, `file_path`, `file_name` together
- **Learnings**: Moving files requires updating the parent-child relationship, not just the path string

### Challenge 6: RLS Policy Error on Soft Delete
- **Issue**: "Replace existing" failed with "new row violates row-level security policy for table files"
- **Root Cause**: Supabase RLS `WITH CHECK` clause on UPDATE was failing even with correct policies
- **Initial Approach**: Tried soft delete with `is_deleted: true` UPDATE
- **Solution**: Changed to hard DELETE instead of soft delete for Replace option in Copy, Move, and Upload APIs
- **Learnings**: Sometimes simpler solutions (DELETE) work better than complex ones (soft delete) when RLS policies are involved

### Challenge 7: Copy to Root Not Setting parent_id
- **Issue**: When copying file to root "/", `parent_id` was left null instead of root directory ID
- **Root Cause**: Code only fetched parent ID for non-root paths
- **Solution**: Added else branch to fetch root directory ID when target is "/"
- **Learnings**: Always handle the root/default case explicitly

---

## 💻 Code Changes

### Files Created
- `src/app/api/files/[id]/move/route.ts` - Move file API with conflict handling
- `src/app/api/files/[id]/copy/route.ts` - Copy file API with conflict handling
- `src/components/directory-picker.tsx` - Tree-based folder picker component
- `src/components/move-dialog.tsx` - Move dialog with conflict resolution
- `src/components/copy-dialog.tsx` - Copy dialog with conflict resolution

### Files Modified
- `src/components/file-list.tsx` - Added Move/Copy handlers and dialogs
- `src/app/api/files/upload/signed-url/route.ts` - Fixed Replace to use hard DELETE

### Key Implementation Details

**Event Propagation Fix:**
```typescript
const handleMove = (e: React.MouseEvent, file: DirectoryListingItem) => {
  e.stopPropagation()
  setSelectedFile(file)
  setMoveDialogOpen(true)
}
```

**Conflict Response Pattern:**
```typescript
return NextResponse.json(
  {
    error: "A file with this name already exists at the destination",
    code: "FILE_EXISTS",
    existingFile: {
      id: existingFile.id,
      name: existingFile.display_name || existingFile.file_name,
      // ... more details
    },
  },
  { status: 409 }
);
```

**Hard Delete for Replace (RLS Fix):**
```typescript
// Hard delete the existing file (RLS UPDATE policy has issues with soft delete)
const { error: deleteError } = await supabase
  .schema("fmanager")
  .from("files")
  .delete()
  .eq("id", existingFile.id)
  .eq("user_id", user.id);
```

**Parent ID Update in Move:**
```typescript
const { error: updateError } = await supabase
  .schema("fmanager")
  .from("files")
  .update({
    file_path: finalFilePath,
    file_name: finalFileName,
    parent_id: newParentId,  // Critical: update parent relationship
    display_name: null,       // Clear so UI shows file_name
    updated_at: new Date().toISOString(),
  })
  .eq("id", fileId)
  .eq("user_id", user.id);
```

---

## 📝 Notes & Learnings

1. **Consistent Conflict Resolution**: Using the same 409 + FILE_EXISTS pattern across Upload, Move, and Copy provides a consistent user experience
2. **Data Integrity**: `display_name`, `file_name`, and `file_path` should stay synchronized to avoid confusion
3. **RLS Policies**: Sometimes DELETE policies work where UPDATE policies fail due to WITH CHECK clause complexity
4. **Parent-Child Relationships**: Moving files isn't just about changing the path string - the `parent_id` relationship must also be updated
5. **Event Handling**: Always use `stopPropagation()` when nested elements have their own click handlers
6. **Edge Cases**: Always handle root directory "/" explicitly in path operations

---

## 🔄 Next Steps

- [ ] Day 11: File Deletion & Trash
  - Implement soft delete functionality
  - Create trash/recycle bin view
  - Add restore functionality
  - Implement permanent delete

---

## 📊 Progress Summary

**Tasks Completed**: 8 / 8
**Blockers**: All Resolved
**Overall Status**: On track

---

## 🎯 Day Reflection

What went well:
- Successfully implemented Move and Copy with full conflict resolution
- Consistent UX pattern with Upload's conflict handling
- All edge cases handled properly

What could be improved:
- Could have anticipated RLS policy issues earlier
- Directory picker could use better visual feedback

What to focus on tomorrow:
- Implement trash/recycle bin functionality
- Add restore from trash
- Consider bulk operations
