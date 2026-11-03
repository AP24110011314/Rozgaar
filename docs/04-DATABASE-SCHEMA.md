# 04 – Database Schema (Mongoose)

Collections: `users`, `applicantprofiles`, `companies`, `jobs`, `applications`, `notifications`.

## users
```js
{
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ['applicant', 'recruiter', 'admin'], default: 'applicant' },
  company: { type: ObjectId, ref: 'Company' },          // recruiters only
  emailVerified: { type: Boolean, default: false },
  refreshTokenHash: { type: String, select: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true }
```

## applicantprofiles
```js
{
  user: { type: ObjectId, ref: 'User', unique: true, required: true },
  headline: String,
  bio: { type: String, maxlength: 1000 },
  phone: String,
  location: {
    city: String, state: String, country: String,
    geo: { type: { type: String, enum: ['Point'] }, coordinates: [Number] } // [lng, lat]
  },
  skills: [String],
  links: [{ label: String, url: String }],
  resumes: [{
    key: String,           // S3 object key
    filename: String,
    mime: String,
    size: Number,
    isDefault: Boolean,
    uploadedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true }
// index: { 'location.geo': '2dsphere' }
```

## companies
```js
{
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  description: String,
  website: String,
  logoKey: String,
  location: { city: String, state: String, geo: { type: {type:String, enum:['Point']}, coordinates:[Number] } },
  owner: { type: ObjectId, ref: 'User' },
  members: [{ user: { type: ObjectId, ref: 'User' }, role: { type: String, enum: ['owner','member'] } }]
}, { timestamps: true }
```

## jobs
```js
{
  company: { type: ObjectId, ref: 'Company', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  employmentType: { type: String, enum: ['full-time','part-time','contract','internship','temporary'] },
  remote: { type: Boolean, default: false },
  location: { city: String, state: String, geo: { type: {type:String, enum:['Point']}, coordinates:[Number] } },
  salary: { min: Number, max: Number, currency: { type: String, default: 'INR' }, period: { type: String, enum: ['hour','month','year'] } },
  skills: [String],
  customFields: { type: Map, of: Schema.Types.Mixed },   // e.g. certifications: [..], shiftTimes: ".."
  status: { type: String, enum: ['draft','open','closed'], default: 'draft', index: true },
  publishedAt: Date,
  expiresAt: Date,
  applicationCount: { type: Number, default: 0 }
}, { timestamps: true }
```
Indexes:
```js
jobSchema.index({ 'location.geo': '2dsphere' });
jobSchema.index({ title: 'text', description: 'text', skills: 'text' });
jobSchema.index({ status: 1, publishedAt: -1 });
```

## applications
```js
{
  job: { type: ObjectId, ref: 'Job', required: true },
  applicant: { type: ObjectId, ref: 'User', required: true },
  company: { type: ObjectId, ref: 'Company', required: true, index: true }, // denormalised for fast board queries
  resume: { key: String, filename: String },        // snapshot at apply time
  coverNote: { type: String, maxlength: 2000 },
  stage: { type: String, enum: ['applied','reviewing','interviewing','offered','hired','rejected','withdrawn'], default: 'applied', index: true },
  position: { type: Number, default: 0 },           // order within a Kanban column
  stageHistory: [{
    stage: String,
    changedBy: { type: ObjectId, ref: 'User' },
    message: String,                                // visible to applicant
    at: { type: Date, default: Date.now }
  }],
  rating: { type: Number, min: 1, max: 5 },
  notes: [{ author: { type: ObjectId, ref: 'User' }, text: String, at: { type: Date, default: Date.now } }] // internal only
}, { timestamps: true }
// unique: { job: 1, applicant: 1 }
// index:  { company: 1, job: 1, stage: 1, position: 1 }
// index:  { applicant: 1, updatedAt: -1 }
```
**Privacy rule:** `notes` and `rating` must be excluded from any applicant-facing response (use a serializer).

## notifications (optional MVP+)
```js
{ user: ObjectId, type: String, application: ObjectId, message: String, readAt: Date }
```

## Kanban ordering
New card position = last position + 1024. On drop between A and B: `(A.position + B.position) / 2`. If gap below 1e-6, rebalance the column.
