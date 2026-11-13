import { Response } from 'express';
import { z } from 'zod';
import { WikiArticle, IWikiArticle } from '../models/WikiArticle.js';
import { AuditLog } from '../models/AuditLog.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { isExecutive } from '../middleware/roles.js';

const customerDetailsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  scaleMetric: z.string().min(1, 'Scale metric is required (e.g. 15,000+ monthly shifts)'),
  industry: z.string().min(1, 'Industry is required'),
  tier: z.enum(['Enterprise (10k+ shifts)', 'Growth (2k-10k shifts)', 'Pilot (<2k shifts)']),
  contactPerson: z.string().optional().default(''),
  contactEmail: z.string().optional().default(''),
  website: z.string().optional().default(''),
  privacyPolicyUrl: z.string().optional().default(''),
  privacyPolicySummary: z.string().optional().default(''),
  slaTerms: z.string().optional().default(''),
  headquarters: z.string().optional().default(''),
  activeCities: z.array(z.string()).optional().default([]),
  status: z.enum(['active', 'onboarding', 'contract_pending', 'churned']).default('active')
});

const wikiArticleSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  category: z.enum(['Enterprise Customer', 'Case Study', 'Privacy & Compliance', 'Operations & SLA', 'General']),
  summary: z.string().min(10, 'Summary must be at least 10 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  isCustomerCase: z.boolean().default(true),
  customerDetails: customerDetailsSchema.optional(),
  visibility: z.enum(['everyone', 'executive_only']).default('everyone'),
  tags: z.array(z.string()).optional().default([]),
  pinned: z.boolean().optional().default(false)
});

/**
 * Seed initial real-world ShiftPe enterprise customer case studies and privacy policies
 */
async function seedDefaultWikiArticles(userId: any, userName: string) {
  try {
    const count = await WikiArticle.countDocuments();
    if (count > 0) return;

    const initialSeed = [
      {
        title: 'Blinkit Instant Grocery Hubs — National Fleet Operations',
        slug: 'blinkit-grocery-hubs-national-fleet',
        category: 'Enterprise Customer',
        summary: 'ShiftPe powers on-demand store staffing and warehouse picking shifts across 28 cities with 99.4% fill rate.',
        content: `### Executive Overview
ShiftPe is the primary workforce partner powering 420+ dark stores and regional sorting hubs for Blinkit across tier-1 and tier-2 Indian metropolitan markets.

#### Deployment Architecture & Scale
- **Active Monthly Shifts**: 48,000+ verified shifts/month
- **Average Shift Duration**: 8.5 hours
- **Real-Time Attendance**: Biometric + QR verification backed by ShiftPe CRM
- **Payout Frequency**: T+1 instant daily payouts via ShiftPe Smart Payout API

#### Data Privacy & Security Framework
All worker identity verifications (Aadhaar & PAN) comply strictly with ISO 27001 data protection standards. Encrypted at rest using AES-256 with role-restricted audit trails. Customer contact points are anonymized to protect individual field personnel.

#### SLA Commitments
- **Hub Dispatch Readiness**: <15 minutes from shift call
- **Incident Escalation Response**: <2 hours for operational disruptions
- **Monthly Uptime SLA**: 99.9% uptime on ShiftPe Teammate & Worker Apps`,
        isCustomerCase: true,
        customerDetails: {
          companyName: 'Blinkit (Eternal Limited)',
          scaleMetric: '48,000+ shifts/month across 28 cities',
          industry: 'Quick-Commerce & Dark Stores',
          tier: 'Enterprise (10k+ shifts)',
          contactPerson: 'Saurabh Verma (VP Operations)',
          contactEmail: 'operations.enterprise@blinkit.com',
          website: 'https://blinkit.com',
          privacyPolicyUrl: 'https://blinkit.com/privacy',
          privacyPolicySummary: 'Complete worker confidentiality; data localized to AWS Mumbai (ap-south-1). No cross-border data replication.',
          slaTerms: '99.5% Fulfillment Rate • T+1 Automated Payroll Reconciliation',
          headquarters: 'Gurugram, Haryana',
          activeCities: ['Delhi NCR', 'Bengaluru', 'Mumbai', 'Pune', 'Hyderabad', 'Kolkata'],
          status: 'active'
        },
        visibility: 'everyone',
        tags: ['Enterprise', 'Q-Commerce', 'National Fleet', 'Blinkit'],
        pinned: true,
        authorId: userId,
        authorName: userName,
        authorRole: 'ceo'
      },
      {
        title: 'Zepto Dark Store Rapid Fulfillment Staffing',
        slug: 'zepto-dark-store-fulfillment',
        category: 'Enterprise Customer',
        summary: 'High-velocity 10-minute delivery warehouse packers and inventory runners managed via ShiftPe.',
        content: `### Strategic Partnership Details
ShiftPe deploys verified micro-fulfillment workers across Zepto distribution centers in Western and Southern India.

#### Key Performance Metrics
- **Current Deployed Fleet**: 22,500 active shift slots
- **Retention Rate**: 82% 90-day retention
- **Compliance Score**: 100% PF/ESIC statutory compliance

#### Privacy & Enterprise SLA
- Dedicated data silo on MongoDB Atlas cluster
- Worker ratings and performance telemetry restricted strictly to authorized store managers`,
        isCustomerCase: true,
        customerDetails: {
          companyName: 'Zepto (Kiranakart Technologies)',
          scaleMetric: '22,500+ shifts/month across 16 cities',
          industry: 'Ultra-Fast Grocery Delivery',
          tier: 'Enterprise (10k+ shifts)',
          contactPerson: 'Aditya Pal (Head of Supply Chain)',
          contactEmail: 'supplychain@zeptonow.com',
          website: 'https://zeptonow.com',
          privacyPolicyUrl: 'https://zeptonow.com/privacy-policy',
          privacyPolicySummary: 'ShiftPe adheres to Zepto Supplier Code of Conduct and Indian Digital Personal Data Protection (DPDP) Act 2023.',
          slaTerms: 'Tier 1 Priority Support • Zero-Penalty Shift Rescheduling within 3 Hours',
          headquarters: 'Mumbai, Maharashtra',
          activeCities: ['Mumbai', 'Bengaluru', 'Delhi NCR', 'Chennai', 'Pune'],
          status: 'active'
        },
        visibility: 'everyone',
        tags: ['Zepto', 'Grocery', 'Fulfillment', 'Enterprise'],
        pinned: false,
        authorId: userId,
        authorName: userName,
        authorRole: 'ceo'
      },
      {
        title: 'Executive Strategic Account: Confidential E-Commerce Logistics Master Contract',
        slug: 'confidential-ecommerce-logistics-master-contract',
        category: 'Case Study',
        summary: 'Confidential commercial contract, unit economics, margin schedules, and pricing matrix for India’s largest marketplace.',
        content: `### 🔒 RESTRICTED TO CEO & FOUNDERS ONLY
This internal memorandum contains proprietary business terms, commission structures, and margin breakdowns for our Tier-0 enterprise client.

#### Commercial Highlights
- **Billing Rate**: ₹148 per verified worker hour
- **Worker Payout**: ₹118 per hour (Gross margin: 20.2%)
- **Annualized Contract Value (ACV)**: ₹18.4 Crores
- **Payment Terms**: Net 15 days direct bank settlement

#### Penalty & Compliance Clauses
- Failure to staff >95% peak festive surge incurs 1.5% SLA penalty.
- Strict Non-Disclosure Agreement (NDA) in effect through Q4 2028.`,
        isCustomerCase: true,
        customerDetails: {
          companyName: 'Confidential National Marketplace Client',
          scaleMetric: '85,000+ surge shifts during festive seasons',
          industry: 'Tier-1 E-Commerce Logistics',
          tier: 'Enterprise (10k+ shifts)',
          contactPerson: 'Confidential (Executive Liaison)',
          contactEmail: 'exec.contracts@confidential.shiftpe.in',
          website: 'https://shiftpe.in',
          privacyPolicyUrl: 'https://shiftpe.in/legal/master-msa',
          privacyPolicySummary: 'Strict NDA. No public marketing or logo usage allowed without written board signoff.',
          slaTerms: 'Guaranteed 98.2% Surge Capacity • 24/7 Dedicated Account Director',
          headquarters: 'Bengaluru, Karnataka',
          activeCities: ['Pan-India (44 Distribution Hubs)'],
          status: 'contract_pending'
        },
        visibility: 'executive_only',
        tags: ['Confidential', 'Executive Only', 'High Margin', 'ACV'],
        pinned: true,
        authorId: userId,
        authorName: userName,
        authorRole: 'ceo'
      },
      {
        title: 'ShiftPe Corporate Data Privacy, GDPR & DPDP Compliance Policy',
        slug: 'shiftpe-corporate-data-privacy-dpdp-policy',
        category: 'Privacy & Compliance',
        summary: 'Official internal standard on customer and worker personal data handling, storage, encryption, and audit rights.',
        content: `### ShiftPe Corporate Privacy & Customer Protection Architecture

#### 1. Scope & Application
This policy applies to all customer accounts, enterprise workforce records, teammate profiles, and telemetry collected through ShiftPe Portal and worker mobile applications.

#### 2. Statutory Adherence
- **Digital Personal Data Protection Act (DPDP Act, 2023)**
- **Information Technology Act, 2000 (Sensitive Personal Data or Information)**
- **ISO/IEC 27001 Information Security Management**

#### 3. Enterprise Customer Data Rights
1. **Right to Erasure & Anonymization**: Enterprise clients may request complete worker attendance anonymization after statutory tax audits (7 years retention for tax/payroll records).
2. **Access Control**: Production client rosters are segregated with Role-Based Access Control (RBAC). Only CEO, Founders, and assigned Account Directors can view executive contracts.
3. **Audit Trails**: Every view, download, and modification of client data creates an immutable entry in \`AuditLog\` with actor IP address and timestamp.`,
        isCustomerCase: false,
        visibility: 'everyone',
        tags: ['Privacy Policy', 'Compliance', 'DPDP', 'Security', 'Legal'],
        pinned: false,
        authorId: userId,
        authorName: userName,
        authorRole: 'ceo'
      }
    ];

    await WikiArticle.insertMany(initialSeed);
  } catch (err) {
    console.warn('Wiki default seed notice:', err);
  }
}

/**
 * GET /api/wiki/articles
 * List Wiki Articles & Enterprise Customers
 * Regular members see only 'everyone'. Executives see all including 'executive_only'.
 */
export async function getArticles(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const hasExecutiveAccess = isExecutive(req.user);

    // Seed defaults if fresh installation
    await seedDefaultWikiArticles(req.user.userId, req.user.name);

    const query: any = {};

    // Strict visibility filtering
    if (!hasExecutiveAccess) {
      query.visibility = 'everyone';
    }

    // Optional category filter
    if (req.query.category && req.query.category !== 'All') {
      query.category = req.query.category;
    }

    // Optional customer tier filter
    if (req.query.tier && req.query.tier !== 'All') {
      query['customerDetails.tier'] = req.query.tier;
    }

    // Optional search keyword
    if (req.query.q) {
      const regex = new RegExp(String(req.query.q).trim(), 'i');
      query.$or = [
        { title: regex },
        { summary: regex },
        { tags: regex },
        { 'customerDetails.companyName': regex },
        { 'customerDetails.industry': regex }
      ];
    }

    const articles = await WikiArticle.find(query).sort({ pinned: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: articles.length,
      isExecutive: hasExecutiveAccess,
      articles
    });
  } catch (error: any) {
    console.error('getArticles error:', error);
    res.status(500).json({ error: 'Failed to retrieve wiki articles: ' + error.message });
  }
}

/**
 * GET /api/wiki/articles/:id
 * Retrieve single article details
 */
export async function getArticle(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const article = await WikiArticle.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { slug: id }]
    });

    if (!article) {
      res.status(404).json({ error: 'Wiki article or customer profile not found.' });
      return;
    }

    // Enforce executive restriction
    if (article.visibility === 'executive_only' && !isExecutive(req.user)) {
      res.status(403).json({
        error: 'Access Restricted: This Wiki document is classified as Executive Only (CEO & Founders).'
      });
      return;
    }

    res.status(200).json({
      success: true,
      article
    });
  } catch (error: any) {
    console.error('getArticle error:', error);
    res.status(500).json({ error: 'Failed to retrieve article: ' + error.message });
  }
}

/**
 * POST /api/wiki/articles
 * Create new Wiki Article or Enterprise Customer Record (CEO / Founder only)
 */
export async function createArticle(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const parseResult = wikiArticleSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    const data = parseResult.data;

    // Generate clean unique slug
    let baseSlug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (await WikiArticle.findOne({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const article = await WikiArticle.create({
      ...data,
      slug,
      authorId: req.user.userId,
      authorName: req.user.name,
      authorRole: req.user.role,
      lastUpdatedBy: req.user.name
    });

    await AuditLog.create({
      action: 'WIKI_ARTICLE_CREATED',
      actorId: req.user.userId,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      targetId: article._id.toString(),
      targetType: 'Wiki',
      details: { title: article.title, category: article.category, visibility: article.visibility }
    });

    res.status(201).json({
      success: true,
      message: 'Wiki document successfully published to ShiftPe CRM!',
      article
    });
  } catch (error: any) {
    console.error('createArticle error:', error);
    res.status(500).json({ error: 'Failed to publish wiki article: ' + error.message });
  }
}

/**
 * PUT /api/wiki/articles/:id
 * Update an existing Wiki document or permissions (CEO / Founder only)
 */
export async function updateArticle(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const article = await WikiArticle.findById(id);
    if (!article) {
      res.status(404).json({ error: 'Wiki article not found.' });
      return;
    }

    const parseResult = wikiArticleSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0].message });
      return;
    }

    Object.assign(article, parseResult.data);
    article.lastUpdatedBy = req.user.name;
    await article.save();

    await AuditLog.create({
      action: 'WIKI_ARTICLE_UPDATED',
      actorId: req.user.userId,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      targetId: article._id.toString(),
      targetType: 'Wiki',
      details: { title: article.title, category: article.category, visibility: article.visibility }
    });

    res.status(200).json({
      success: true,
      message: 'Wiki document updated successfully.',
      article
    });
  } catch (error: any) {
    console.error('updateArticle error:', error);
    res.status(500).json({ error: 'Failed to update article: ' + error.message });
  }
}

/**
 * DELETE /api/wiki/articles/:id
 * Delete a Wiki entry (CEO / Founder only)
 */
export async function deleteArticle(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const article = await WikiArticle.findByIdAndDelete(id);
    if (!article) {
      res.status(404).json({ error: 'Wiki article not found.' });
      return;
    }

    await AuditLog.create({
      action: 'WIKI_ARTICLE_DELETED',
      actorId: req.user.userId,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      targetId: id,
      targetType: 'Wiki',
      details: { title: article.title }
    });

    res.status(200).json({
      success: true,
      message: 'Wiki document deleted.'
    });
  } catch (error: any) {
    console.error('deleteArticle error:', error);
    res.status(500).json({ error: 'Failed to delete wiki article: ' + error.message });
  }
}
