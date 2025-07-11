# Script Limit Feature

## Overview

Users are now limited to storing a maximum of 5 scripts in the database to help manage server space and costs.

## Implementation Details

### Backend Changes

1. **FirestoreService (`src/server/firebase.ts`)**

   - Added `countUserDocuments()` method to count documents in a user's subcollection
   - Modified `addUserDocument()` to check the 5-script limit before adding new documents
   - Only applies the limit to the "uploaded_data" subcollection (scripts)

2. **Firebase Router (`src/server/api/routers/firebase.ts`)**
   - Added `getUserDocumentCount` endpoint to get current script count
   - Added `deleteUserDocument` endpoint to allow users to delete scripts

### Frontend Changes

1. **AddScriptDoc Component (`src/components/AddScriptDoc.tsx`)**
   - Added script count display showing "Scripts: X/5"
   - Shows "Limit reached" badge when at 5 scripts
   - Disables "Add Script" button when limit is reached
   - Shows helpful message explaining the limit
   - Button text changes to "Limit Reached" when at maximum

## User Experience

### When Below Limit (0-4 scripts)

- Users see their current script count: "Scripts: 3/5"
- Add Script button is enabled and functional
- Normal script upload workflow

### When At Limit (5 scripts)

- Users see: "Scripts: 5/5" with a red "Limit reached" badge
- Add Script button is disabled and shows "Limit Reached"
- Helpful message: "You've reached the limit of 5 scripts. Please delete an existing script before adding a new one."

## Error Handling

- Server-side validation prevents adding scripts when at limit
- Clear error messages guide users to delete existing scripts
- Graceful degradation with proper TypeScript types

## Technical Notes

- Limit only applies to Firestore storage (not local files)
- Admin users are not affected by this limit
- The limit is enforced at the database level for security
- Script count is cached and updated in real-time

## Future Enhancements

- Add script deletion UI in the frontend
- Implement script management dashboard
- Add upgrade options for users who need more scripts
- Add analytics to track usage patterns
