import mongoose from 'mongoose';

const stageHistorySchema = new mongoose.Schema(
  {
    stage: {
      type: String,
      enum: ['applied', 'reviewing', 'interviewing', 'offered', 'hired', 'rejected', 'withdrawn'],
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    message: {
      type: String,
      default: '',
      trim: true,
    },
    at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const noteSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job reference is required'],
      index: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Applicant reference is required'],
      index: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true,
    },
    resume: {
      key: {
        type: String,
        required: true,
      },
      filename: {
        type: String,
        required: true,
      },
    },
    coverNote: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    stage: {
      type: String,
      enum: ['applied', 'reviewing', 'interviewing', 'offered', 'hired', 'rejected', 'withdrawn'],
      default: 'applied',
      index: true,
    },
    position: {
      type: Number,
      default: 1024,
      index: true,
    },
    stageHistory: {
      type: [stageHistorySchema],
      default: [],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    notes: {
      type: [noteSchema],
      default: [],
    },
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

// Indexes
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
applicationSchema.index({ company: 1, job: 1, stage: 1, position: 1 });
applicationSchema.index({ applicant: 1, updatedAt: -1 });

// Helper method to sanitize applicant-facing response
applicationSchema.methods.toApplicantJSON = function () {
  const obj = this.toObject();
  delete obj.rating;
  delete obj.notes;
  return obj;
};

export const Application = mongoose.model('Application', applicationSchema);

