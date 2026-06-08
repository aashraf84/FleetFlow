# Task 2-b: Add Edit/Delete CRUD to RentalReservationsPage and MaintenancePreventivePage

## Work Completed

### RentalReservationsPage.tsx
- Added full edit functionality: editId state, openEdit() pre-fills form, handleSubmit supports PUT
- Added delete/cancel functionality: deleteId state, handleDelete() with confirmation dialog
- Form sanitization: strips id, createdAt, updatedAt, customer, vehicle, reservationCode, tenantId
- Edit button (Pencil icon) on every row, Cancel Reservation (Trash2) on pending/confirmed rows
- Loader2 spinner on submit/delete buttons with saving/deleting states
- Added returnLocation and notes fields to form dialog
- Vehicle selector includes current vehicle in edit mode

### MaintenancePreventivePage.tsx
- Added full edit functionality: editId state, openEdit() pre-fills form, handleSubmit supports PUT
- Added delete functionality: deleteId state, handleDelete() with confirmation dialog
- Form sanitization: strips id, createdAt, updatedAt, vehicle, jobCard, spareParts, tenantId
- Edit button (Pencil icon) on every row, Delete (Trash2) on scheduled rows only
- Loader2 spinner on submit/delete buttons with saving/deleting states
- Added Priority, Vendor, and Notes fields to form dialog

### Both APIs already supported PUT and DELETE
- `/api/fleet/reservations` — PUT strips id via destructuring, DELETE via `?id=` query param
- `/api/fleet/maintenance` — PUT strips id via destructuring, DELETE via `?id=` query param

### Lint: Zero errors
