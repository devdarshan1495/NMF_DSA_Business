# Quick Test Guide - Prescription Verification

## ✅ Testing the "Verify Prescription" Button

### Test 1: Basic Verification
1. **Login as Pharmacist**
2. **Go to Pharmacy Dashboard**
3. **Paste a prescription ID** in the textarea
4. **Click "Verify Prescription" button**
5. **Expected Result**: 
   - Prescription details appear
   - Status badge shows "VIEWED"
   - Firebase status updated to "viewed"

### Test 2: Already Viewed Prescription
1. **Verify the same prescription again**
2. **Expected Result**:
   - Details still show
   - Status remains "viewed"
   - Can still mark as filled

### Test 3: Mark as Filled
1. **View a prescription**
2. **Click "Mark as Filled" button**
3. **Expected Result**:
   - Success message appears
   - Status updates to "filled"
   - Input field clears

### Test 4: Already Filled Prescription
1. **Try to verify a filled prescription**
2. **Expected Result**:
   - Error message: "ALREADY FILLED"
   - Cannot mark as filled again

### Test 5: Invalid Prescription ID
1. **Enter a fake ID** (e.g., "12345-test")
2. **Click Verify**
3. **Expected Result**:
   - Error: "NOT FOUND: Prescription does not exist"

## 🔍 Check Firebase Data

### Before Viewing:
```json
{
  "prescriptionId": "20251007-452970039",
  "status": "active",
  "issueDate": "2025-10-07T10:00:00.000Z"
}
```

### After Viewing:
```json
{
  "prescriptionId": "20251007-452970039",
  "status": "viewed",
  "issueDate": "2025-10-07T10:00:00.000Z",
  "viewedDate": "2025-10-07T15:30:00.000Z",
  "viewedAt": "2025-10-07T15:30:00.000Z"
}
```

### After Marking as Filled:
```json
{
  "prescriptionId": "20251007-452970039",
  "status": "filled",
  "issueDate": "2025-10-07T10:00:00.000Z",
  "viewedDate": "2025-10-07T15:30:00.000Z",
  "viewedAt": "2025-10-07T15:30:00.000Z",
  "filledDate": "2025-10-07T15:45:00.000Z"
}
```

## 📊 Dashboard Stats

### Check These Update Correctly:
- **Verified Today**: Count of prescriptions marked "filled" today
- **Pending Verification**: Count of "active" + "viewed" prescriptions
- **Total Verified**: All-time count of "filled" prescriptions

## 🐛 Troubleshooting

### Button Not Working?
1. Open browser console (F12)
2. Look for: `✅ Verify form initialized successfully`
3. If not found, check:
   - Is the form ID correct? (`verify-form`)
   - Did the page finish loading?
   - Any JavaScript errors?

### Status Not Updating?
1. Check Firebase console
2. Verify Firebase connection
3. Check browser console for errors
4. Look for: `✅ Prescription status updated to "viewed"`

### Can't Paste Prescription ID?
1. Use the "📋 Paste" button
2. Try Cmd+V (Mac) or Ctrl+V (Windows)
3. Manually type if needed

## 🎯 Success Indicators

✅ **Form initialized** - Console shows initialization message  
✅ **Verification works** - Details display correctly  
✅ **Status updates** - Firebase shows "viewed" status  
✅ **Mark as filled works** - Status changes to "filled"  
✅ **Stats update** - Dashboard numbers change  
✅ **Error handling** - Invalid IDs show error messages  

## 📝 Console Logs to Look For

```
📋 Page loaded, initializing pharmacist dashboard...
✅ Verify form initialized successfully
🔍 Verifying prescription: 20251007-452970039
✅ Prescription status updated to "viewed"
✅ Prescription 20251007-452970039 status updated to viewed
```

---

**Ready to test!** 🚀
