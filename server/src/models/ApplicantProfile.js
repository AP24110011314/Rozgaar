import mongoose from 'mongoose';

const resumeSubSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    mime: {
      type: String,
      required: true,
      enum: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    },
    size: {
      type: Number,
      required: true,
      max: 5 * 1024 * 1024, // 5 MB
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const linkSubSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const applicantProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    headline: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      city: {
        type: String,
        trim: true,
        default: '',
      },
      state: {
        type: String,
        trim: true,
        default: '',
      },
      country: {
        type: String,
        trim: true,
        default: 'India',
      },
      geo: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          default: [77.2090, 28.6139], // Default New Delhi coordinates
        },
      },
    },
    skills: {
      type: [String],
      default: [],
    },
    links: {
      type: [linkSubSchema],
      default: [],
    },
    resumes: {
      type: [resumeSubSchema],
      default: [],
      validate: [
        (val) => val.length <= 3,
        'Cannot exceed maximum of 3 resumes',
      ],
    },
    savedJobs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
      },
    ],
    isSeed: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index on location.geo for radius search
applicantProfileSchema.index({ 'location.geo': '2dsphere' });

export const ApplicantProfile = mongoose.model('ApplicantProfile', applicantProfileSchema);

