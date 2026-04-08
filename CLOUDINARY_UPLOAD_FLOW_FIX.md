# Cloudinary Upload Flow - Comprehensive Fix & Testing Guide

## What Was Fixed

### 1. **Backend Upload Endpoints** ✅
All 4 endpoints properly return Cloudinary URLs:
- `/api/uploads/event-image` → Returns `{ url: secure_url, ... }`
- `/api/uploads/resume` → Returns `{ url: secure_url, ... }`
- `/api/uploads/message-file` → Returns `{ url: secure_url, ... }`
- `/api/uploads/memory-image` → Returns `{ url: secure_url, ... }`

### 2. **Frontend Image Configuration** ✅
Added Cloudinary domain to Next.js allowed image domains:
- `res.cloudinary.com` - For Cloudinary hosted files
- `api.dicebear.com` - For avatar generation

### 3. **Resume Display Conditional Rendering** ✅
Added checks to only display download links if `resume_url` exists:
- **Pending Requests Section** - Shows warning if resume missing
- **In Progress Section** - Shows warning if resume missing  
- **Completed Section** - Shows warning if resume missing

---

## Complete Upload Flow Diagram

```
STUDENT UPLOADS RESUME
        ↓
Frontend: POST /api/uploads/resume with File
        ↓
Backend: Multer validates (10MB max, PDF/DOC/DOCX only)
        ↓
Backend: Upload buffer to Cloudinary
        ↓
Cloudinary: Stores file & returns secure_url
        ↓
Backend: Returns { url: "https://res.cloudinary.com/...", filename, size, publicId }
        ↓
Frontend: Stores in state: resume.url = Cloudinary URL
        ↓
Frontend: POST /api/resume-reviews/request with resume_url
        ↓
Backend: Validates student & alumni exist
        ↓
Backend: INSERT into resume_reviews table with Cloudinary URL
        ↓
ALUMNI VIEWS REQUESTS
        ↓
Frontend: GET /api/resume-reviews/alumni/:email
        ↓
Backend: SELECT * FROM resume_reviews WHERE alumni_email = ...
        ↓
Backend: Returns [ { id, resume_url: "https://res.cloudinary.com/...", ... } ]
        ↓
Frontend: Maps requests & conditionally renders download link
        ↓
IF resume_url exists: <a href={resume_url}> ✅ DOWNLOAD
IF resume_url is null: ⚠️ RESUME NOT AVAILABLE
```

---

## Step-by-Step Testing

### **Test 1: Student Uploads Resume**

1. Navigate to **Student > Resume Review** page
2. Select an alumni mentor
3. Click **Choose File** and select a PDF/DOC/DOCX file (<10MB)
4. **Check Browser Console (F12 > Console tab)**
   - Should see: `Resume upload error: ...` or success
5. **Expected Result**: Upload succeeds, shows filename

### **Test 2: Student Submits Request to Alumni**

1. After uploading resume, write a message
2. Click **Send Request**
3. **Check Browser Console**
   - Look for network activity to `/api/resume-reviews/request`
   - Should see 201 response with request details
4. **Expected Result**: Request submitted successfully

### **Test 3: Alumni Sees Resume Request**

1. **Switch to Alumni account** (or open in new browser/incognito)
2. Navigate to **Alumni > Resume Reviews**
3. Look for **Pending** section
4. **Verify**:
   - Student name shows
   - Student email shows
   - `resume_url` property link appears
   - Click link → Should open Cloudinary PDF in new tab
5. **If Link NOT Showing**:
   - See error message: "⚠️ Resume not available"
   - This means `resume_url` is NULL in database

### **Test 4: Alumni Downloads & Provides Feedback**

1. Click resume download link (should open in new tab)
2. Verify file opens correctly in browser or starts download
3. Click **Provide Feedback** button
4. Write feedback and submit
5. Verify status changes to "Complete"3. **Expected Result**: All operations succeed

---

## Troubleshooting Checklist

### **If Resume Upload Fails:**
- ✅ Check file is <10MB
- ✅ Check file type is PDF, DOC, or DOCX
- ✅ Check backend is running (port 4000)
- ✅ Check browser console for detailed error
- ✅ Check Cloudinary credentials in `.env` are correct
- ✅ Check backend logs for upload errors

### **If Resume URL is NULL in Database:**
- ✅ Verify `resume.url` was set after upload (check console.log)
- ✅ Verify `resume_url` is being sent in POST body (check Network tab)
- ✅ Check backend POST endpoint received the URL
- ✅ Run: `curl http://localhost:4000/api/resume-reviews/debug` to see all records

### **If Download Link Doesn't Work:**
- ✅ Copy the `resume_url` and paste in browser address bar
- ✅ Verify URL is valid Cloudinary URL (starts with `res.cloudinary.com`)
- ✅ Check Cloudinary dashboard to see if file was uploaded
- ✅ Verify Cloudinary credentials haven't been revoked

### **If Alumni Page Shows No Requests:**
- ✅ Verify you're logged in as the alumni who received requests
- ✅ Run debug endpoint: `curl "http://localhost:4000/api/resume-reviews/debug"` to list all requests
- ✅ Check alumnus email matches exactly (case-sensitive in some cases)
- ✅ Verify student has `user_type = 'student'` in users table
- ✅ Verify alumni has `user_type = 'alumni'` AND `is_mentor = true` AND `approval_status = 'approved'`

---

## Testing Different Upload Types

🔵 **Event Images** - Admin/Alumni creates event
- File: `/admin/events/create/page.tsx`
- Size limit: 5MB, images only
- Stored in DB: `events.image_url`
- Cloudinary folder: `connecting-future/event-images/`

🟣 **Memory Images** - Alumni uploads memory
- File: `/alumni/memories/page.tsx`
- Size limit: 10MB, images only
- Stored in DB: `memories.image_url`
- Cloudinary folder: `connecting-future/memory-images/`

🟢 **Message Attachments** - User sends file in message
- File: `/student/messages/page.tsx`, `/alumni/messages/page.tsx`
- Size limit: 25MB, any file type
- Stored in DB: `messages.attachment_url`
- Cloudinary folder: `connecting-future/messages/`

---

## Database Verification Queries

Run these in your database client:

```sql
-- Check resume reviews with URLs
SELECT id, student_email, alumni_email, resume_url, filename, status 
FROM resume_reviews 
ORDER BY requested_at DESC 
LIMIT 10;

-- Check events with image URLs
SELECT id, title, image_url 
FROM events 
WHERE image_url IS NOT NULL 
LIMIT 5;

-- Check memories with image URLs
SELECT id, user_email, image_url 
FROM memories 
WHERE image_url IS NOT NULL 
LIMIT 5;

-- Check messages with attachments
SELECT id, sender_email, receiver_email, attachment_url 
FROM messages 
WHERE attachment_url IS NOT NULL 
LIMIT 5;
```

---

## Cloudinary Dashboard Verification

1. Log in to [cloudinary.com/console](https://cloudinary.com/console)
2. Go to **Media Library**
3. Look for folders:
   - `connecting-future/event-images/`
   - `connecting-future/resumes/`
   - `connecting-future/memory-images/`
   - `connecting-future/messages/`
4. Verify your uploaded files appear in correct folders
5. Click any file to see its Cloudinary URL (marked as "URL")

---

## Environment Variables Checklist

Verify in `/backend/.env`:

```
CLOUDINARY_CLOUD_NAME=dzgbhybpa
CLOUDINARY_API_KEY=162564415692572
CLOUDINARY_API_SECRET=rEmK_vUbAHi_R9wd44CuM84wGwI
```

⚠️ **IMPORTANT**: Keep API_SECRET secure! Never commit `.env` to git.

---

## Performance Notes

✅ **Memory Storage** - Files buffered in RAM before upload (faster, needs cleanup)
✅ **Automatic Sizing** - Images auto-optimized by Cloudinary (smaller file sizes)
✅ **CDN Delivery** - Cloudinary serves from nearest edge location (global)
✅ **No Local Disk** - Scales infinitely without storage concerns

---

**Status**: ✅ All fixes applied and ready for end-to-end testing
