import mongoose, { Document, Schema, Types } from 'mongoose';

export type WikiCategory = 'Enterprise Customer' | 'Case Study' | 'Privacy & Compliance' | 'Operations & SLA' | 'General';
export type WikiVisibility = 'everyone' | 'executive_only';
export type CustomerScale = 'Enterprise (10k+ shifts)' | 'Growth (2k-10k shifts)' | 'Pilot (<2k shifts)';

export interface ICustomerDetails {
  companyName: string;
  scaleMetric: string; // e.g. "15,000+ shifts/month"
  industry: string; // e.g. "Quick-Commerce / Logistics"
  tier: CustomerScale;
  contactPerson?: string;
  contactEmail?: string;
  website?: string;
  privacyPolicyUrl?: string;
  privacyPolicySummary?: string;
  slaTerms?: string;
  headquarters?: string;
  activeCities?: string[];
  status: 'active' | 'onboarding' | 'contract_pending' | 'churned';
}

export interface IWikiArticle extends Document {
  title: string;
  slug: string;
  category: WikiCategory;
  summary: string;
  content: string; // Markdown / detailed body
  isCustomerCase: boolean;
  customerDetails?: ICustomerDetails;
  visibility: WikiVisibility; // 'everyone' | 'executive_only'
  tags: string[];
  pinned: boolean;
  authorId: Types.ObjectId;
  authorName: string;
  authorRole: string;
  lastUpdatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const wikiArticleSchema = new Schema<IWikiArticle>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: {
      type: String,
      enum: ['Enterprise Customer', 'Case Study', 'Privacy & Compliance', 'Operations & SLA', 'General'],
      default: 'Enterprise Customer',
      index: true
    },
    summary: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    isCustomerCase: { type: Boolean, default: false },
    customerDetails: {
      companyName: { type: String, trim: true },
      scaleMetric: { type: String, trim: true },
      industry: { type: String, trim: true },
      tier: {
        type: String,
        enum: ['Enterprise (10k+ shifts)', 'Growth (2k-10k shifts)', 'Pilot (<2k shifts)'],
        default: 'Enterprise (10k+ shifts)'
      },
      contactPerson: { type: String, trim: true },
      contactEmail: { type: String, trim: true },
      website: { type: String, trim: true },
      privacyPolicyUrl: { type: String, trim: true },
      privacyPolicySummary: { type: String, trim: true },
      slaTerms: { type: String, trim: true },
      headquarters: { type: String, trim: true },
      activeCities: [{ type: String }],
      status: {
        type: String,
        enum: ['active', 'onboarding', 'contract_pending', 'churned'],
        default: 'active'
      }
    },
    visibility: {
      type: String,
      enum: ['everyone', 'executive_only'],
      default: 'everyone',
      index: true
    },
    tags: [{ type: String, trim: true }],
    pinned: { type: Boolean, default: false },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    authorRole: { type: String, required: true },
    lastUpdatedBy: { type: String }
  },
  { timestamps: true }
);

wikiArticleSchema.index({ category: 1, visibility: 1 });
wikiArticleSchema.index({ 'customerDetails.companyName': 1 });

export const WikiArticle = mongoose.model<IWikiArticle>('WikiArticle', wikiArticleSchema);
