# Orbit authorization and roles

> **Status: proposed future product.** Orbit is not currently implemented, deployed, or provisioned. These requirements describe an approved documentation target, not current runtime behavior.

This page is the proposed authorization contract for product entry, workspace membership, board access, role precedence, and negative permission cases.

## 5. Authorization model and exact role rules

### 5.1 Four separate decisions

An operation is permitted only when all relevant checks pass:

```text
verified identity + active IAM profile
    AND active Orbit product entitlement / required product capability
    AND active workspace membership
    AND effective board permission, where applicable
    AND valid resource state + operation-specific conditions
```

Terms acceptance, MFA assurance, invitation scope, quotas, and suspension are additional restrictions. A denial at any layer wins. A UI role label is never an authorization input.

### 5.2 Product-level IAM roles — proposed additions

| Role                | Capabilities                                                                  | Does not grant                                                        |
| ------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `orbit.participant` | `orbit.app.enter`                                                             | Workspace creation, CMS access, or membership in arbitrary workspaces |
| `orbit.creator`     | Participant plus `orbit.workspace.create`                                     | Membership in another user's workspace                                |
| `orbit.operator`    | Explicit `orbit.operations.read` and/or `orbit.operations.manage` assignments | Automatic content access or workspace ownership                       |

Use the existing IAM registry and assignment system. Capability strings above are proposed, not existing functions. Do not modify `admin.full_access` to implicitly include Orbit data. Admin operators must have both Admin entry authorization and a specific new Orbit operational capability.

Invite-only alpha: an operator enables initial creators. A valid workspace invitation may provision a minimal `orbit.participant` entitlement through an audited IAM-owned command after acceptance. A workspace administrator cannot grant creator/operator/CMS roles. Global account or product suspensions must not be undone by accepting an invitation.

### 5.3 Workspace roles

| Effective role | Meaning                                                                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Owner**      | One accountable owner; can transfer ownership, manage administrators, and request workspace deletion                              |
| **Admin**      | Workspace configuration, members below Admin, all board management, moderation; cannot transfer ownership or delete the workspace |
| **Member**     | Contribute to visible boards, create boards, manage boards they create, maintain own personal preferences                         |
| **Viewer**     | Read visible workspace boards; cannot comment, react, upload, or change content                                                   |
| **Guest**      | No inherited workspace board access; receives an explicit board role for each shared board                                        |

The owner is authoritative in `workspaces.owner_user_id`. Do not maintain an independent, conflicting owner flag. An owner must have an active workspace membership. Workspace membership rows use `admin`, `member`, `viewer`, or `guest`; effective Owner is derived from the workspace owner reference.

### 5.4 Board roles

| Board role    | Content                               | Collaboration                                               | Board administration                               |
| ------------- | ------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| **Manager**   | All Editor actions                    | Moderate comments; manage allowed board memberships         | Edit board settings/columns; archive/restore board |
| **Editor**    | Create/edit/move/assign/archive cards | Comment, react, upload, manage own attachments              | No column/settings/member administration           |
| **Commenter** | Read cards only                       | Comment and react; edit/delete own comments                 | No uploads or card mutation                        |
| **Viewer**    | Read only                             | Personal watch preference only when that feature is enabled | None                                               |

A Guest may be Editor, Commenter, or Viewer, never Manager. A workspace Viewer is capped at board Viewer even when an erroneous higher board assignment is present; valid writes must reject such an assignment as well.

### 5.5 Visibility and effective-role precedence

Boards are either `workspace` or `private` in P0. **Private means hidden from other regular workspace participants, not hidden from the workspace Owner/Admin.** Display that rule in the private-board creation dialog. There is no secretly administrator-inaccessible board class in this design.

Evaluate in this order:

1. Reject missing identity, inactive profile/product/workspace membership, inaccessible lifecycle state, or unmet assurance requirements.
2. Workspace Owner/Admin → Manager on every board in that workspace.
3. Guest → use explicit Viewer/Commenter/Editor assignment only; no assignment means denied.
4. Workspace Viewer → Viewer on workspace-visible boards; on private boards require an explicit assignment, still capped at Viewer.
5. Workspace Member → explicit board assignment replaces the default; otherwise Editor on workspace-visible boards and denied on private boards.
6. A board creator who is a Member receives a Manager assignment. Only Owner/Admin may grant or revoke Manager assignments. Existing Managers may manage lower board roles, never promote a manager or themselves to a workspace role.

A board Manager may add only existing active workspace members who already have Orbit entitlement. Bringing in a new person requires a workspace invitation from Owner/Admin. Cross-workspace role inheritance does not exist.

### 5.6 Workspace permission matrix

“Own” means a user-owned preference, not arbitrary workspace data. Board actions remain subject to the effective board role.

| Operation                                | Owner               | Admin | Member       | Viewer | Guest                             |
| ---------------------------------------- | ------------------- | ----- | ------------ | ------ | --------------------------------- |
| Read workspace name/basic context        | Yes                 | Yes   | Yes          | Yes    | Minimal shared-board context      |
| Read full member directory               | Yes                 | Yes   | Yes          | Yes    | No; board-safe collaborators only |
| Change workspace settings                | Yes                 | Yes   | No           | No     | No                                |
| Invite Member/Viewer/Guest               | Yes                 | Yes   | No           | No     | No                                |
| Assign or remove Admin                   | Yes                 | No    | No           | No     | No                                |
| Change/remove lower membership roles     | Yes                 | Yes   | No           | No     | No                                |
| Remove or demote Owner                   | Transfer only       | No    | No           | No     | No                                |
| Create board                             | Yes                 | Yes   | Yes          | No     | No                                |
| Read every private board                 | Yes                 | Yes   | No           | No     | No                                |
| Manage workspace label taxonomy          | Yes                 | Yes   | No           | No     | No                                |
| Request full workspace export (P1)       | Yes                 | No    | No           | No     | No                                |
| Request export of a managed board (P1)   | Yes                 | Yes   | Manager only | No     | No                                |
| Read workspace security audit            | Yes                 | Yes   | No           | No     | No                                |
| Leave workspace                          | Transfer first      | Yes   | Yes          | Yes    | Yes                               |
| Request workspace deletion               | Yes, step-up        | No    | No           | No     | No                                |
| Transfer ownership                       | Yes, two-party flow | No    | No           | No     | No                                |
| Change own notification/view preferences | Own                 | Own   | Own          | Own    | Own                               |

### 5.7 Board permission matrix

| Operation                                         | Manager                    | Editor | Commenter | Viewer |
| ------------------------------------------------- | -------------------------- | ------ | --------- | ------ |
| Read cards, visible activity, allowed attachments | Yes                        | Yes    | Yes       | Yes    |
| Search and filter accessible cards                | Yes                        | Yes    | Yes       | Yes    |
| Create/edit/move/assign/complete cards            | Yes                        | Yes    | No        | No     |
| Add/remove existing labels on cards               | Yes                        | Yes    | No        | No     |
| Manage checklists (P1)                            | Yes                        | Yes    | No        | No     |
| Archive/unarchive/trash cards                     | Yes                        | Yes    | No        | No     |
| Restore a trashed card                            | Yes                        | No     | No        | No     |
| Comment/react                                     | Yes                        | Yes    | Yes       | No     |
| Edit own comment                                  | Yes                        | Yes    | Yes       | No     |
| Edit another user's comment                       | No                         | No     | No        | No     |
| Remove another user's comment, with audit         | Yes                        | No     | No        | No     |
| Upload attachment                                 | Yes                        | Yes    | No        | No     |
| Remove own attachment                             | Yes                        | Yes    | No        | No     |
| Remove someone else's attachment, with audit      | Yes                        | No     | No        | No     |
| Change board/columns/order of columns             | Yes                        | No     | No        | No     |
| Manage lower board roles for existing members     | Yes                        | No     | No        | No     |
| Grant Manager role                                | Workspace Owner/Admin only | No     | No        | No     |
| Archive/restore/trash board                       | Yes                        | No     | No        | No     |
| Permanently purge data                            | Retention worker only      | No     | No        | No     |

Deleting a comment creates a tombstone and audit event; editing someone else's text is never moderation. A card author does not retain editing rights after their board access is reduced. An assignee is not automatically a member or an editor.

### 5.8 Important negative examples

A Portfolio CMS administrator cannot read Orbit boards solely because they can open Admin. A Guest assigned one board cannot enumerate the rest of the workspace. A Member cannot insert themselves as an Admin through the Data API. A removed collaborator cannot use an old tab, saved card URL, existing notification, export job, or direct Storage path to retrieve newly restricted content.

---
