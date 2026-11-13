import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { WikiArticleItem } from '../types';
import {
  BookOpen,
  Building2,
  Lock,
  Globe,
  Search,
  Plus,
  Shield,
  ExternalLink,
  Sparkles,
  Edit3,
  Trash2,
  X
} from 'lucide-react';

export const WikiView: React.FC = () => {
  const { user, token } = useAuth();
  const isExecutive = user?.role === 'ceo' || (user?.email && (user.email.includes('.founder@shiftpe.in') || user.email === 'founders@shiftpe.in'));

  const [articles, setArticles] = useState<WikiArticleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<WikiArticleItem | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State for Creation / Editing (CEO & Founders)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<WikiArticleItem | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<any>('Enterprise Customer');
  const [formSummary, setFormSummary] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formVisibility, setFormVisibility] = useState<'everyone' | 'executive_only'>('everyone');
  const [formTags, setFormTags] = useState('');
  const [formPinned, setFormPinned] = useState(false);

  // Customer Details Form Fields
  const [isCustomerCase, setIsCustomerCase] = useState(true);
  const [companyName, setCompanyName] = useState('');
  const [scaleMetric, setScaleMetric] = useState('');
  const [industry, setIndustry] = useState('');
  const [tier, setTier] = useState<any>('Enterprise (10k+ shifts)');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState('');
  const [privacyPolicySummary, setPrivacyPolicySummary] = useState('');
  const [slaTerms, setSlaTerms] = useState('');
  const [headquarters, setHeadquarters] = useState('');
  const [activeCities, setActiveCities] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let url = '/api/wiki';
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedTier !== 'All') params.append('tier', selectedTier);
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, { headers, credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setArticles(data.articles || []);
      }
    } catch (err) {
      console.error('Failed to load wiki articles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [token, selectedCategory, selectedTier, searchQuery]);

  const openCreateModal = () => {
    setEditingArticle(null);
    setFormTitle('');
    setFormCategory('Enterprise Customer');
    setFormSummary('');
    setFormContent('');
    setFormVisibility('everyone');
    setFormTags('');
    setFormPinned(false);
    setIsCustomerCase(true);
    setCompanyName('');
    setScaleMetric('');
    setIndustry('');
    setTier('Enterprise (10k+ shifts)');
    setContactPerson('');
    setContactEmail('');
    setPrivacyPolicyUrl('');
    setPrivacyPolicySummary('');
    setSlaTerms('');
    setHeadquarters('');
    setActiveCities('');
    setIsModalOpen(true);
  };

  const openEditModal = (article: WikiArticleItem) => {
    setEditingArticle(article);
    setFormTitle(article.title);
    setFormCategory(article.category);
    setFormSummary(article.summary);
    setFormContent(article.content);
    setFormVisibility(article.visibility);
    setFormTags(article.tags?.join(', ') || '');
    setFormPinned(article.pinned || false);
    setIsCustomerCase(article.isCustomerCase);
    if (article.customerDetails) {
      setCompanyName(article.customerDetails.companyName || '');
      setScaleMetric(article.customerDetails.scaleMetric || '');
      setIndustry(article.customerDetails.industry || '');
      setTier(article.customerDetails.tier || 'Enterprise (10k+ shifts)');
      setContactPerson(article.customerDetails.contactPerson || '');
      setContactEmail(article.customerDetails.contactEmail || '');
      setPrivacyPolicyUrl(article.customerDetails.privacyPolicyUrl || '');
      setPrivacyPolicySummary(article.customerDetails.privacyPolicySummary || '');
      setSlaTerms(article.customerDetails.slaTerms || '');
      setHeadquarters(article.customerDetails.headquarters || '');
      setActiveCities(article.customerDetails.activeCities?.join(', ') || '');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);

    if (!formTitle.trim() || !formSummary.trim() || !formContent.trim()) {
      setActionMessage({ type: 'error', text: 'Title, summary, and detailed content are required.' });
      return;
    }

    if (isCustomerCase && (!companyName.trim() || !scaleMetric.trim() || !industry.trim())) {
      setActionMessage({ type: 'error', text: 'Customer name, scale metric, and industry are required for customer entries.' });
      return;
    }

    setIsSaving(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload: any = {
        title: formTitle.trim(),
        category: formCategory,
        summary: formSummary.trim(),
        content: formContent.trim(),
        isCustomerCase,
        visibility: formVisibility,
        tags: formTags.split(',').map(t => t.trim()).filter(Boolean),
        pinned: formPinned
      };

      if (isCustomerCase) {
        payload.customerDetails = {
          companyName: companyName.trim(),
          scaleMetric: scaleMetric.trim(),
          industry: industry.trim(),
          tier,
          contactPerson: contactPerson.trim(),
          contactEmail: contactEmail.trim(),
          privacyPolicyUrl: privacyPolicyUrl.trim(),
          privacyPolicySummary: privacyPolicySummary.trim(),
          slaTerms: slaTerms.trim(),
          headquarters: headquarters.trim(),
          activeCities: activeCities.split(',').map(c => c.trim()).filter(Boolean),
          status: 'active'
        };
      }

      const method = editingArticle ? 'PUT' : 'POST';
      const endpoint = editingArticle ? `/api/wiki/${editingArticle._id}` : '/api/wiki';

      const res = await fetch(endpoint, {
        method,
        headers,
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        setIsModalOpen(false);
        if (selectedArticle && editingArticle && selectedArticle._id === editingArticle._id) {
          setSelectedArticle(data.article);
        }
        await fetchArticles();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Failed to save wiki article.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Error saving wiki article.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (articleId: string) => {
    if (!window.confirm('Are you sure you want to delete this wiki document?')) return;

    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/wiki/${articleId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });

      if (res.ok) {
        if (selectedArticle?._id === articleId) {
          setSelectedArticle(null);
        }
        await fetchArticles();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div style={{
        padding: '26px 30px',
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--card-shadow)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--shiftpe-coral-light)',
            border: '1px solid var(--shiftpe-coral-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--shiftpe-coral)'
          }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '21px', fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--text)' }}>
                ShiftPe Enterprise Wiki
              </h1>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--accent-green)',
                border: '1px solid rgba(16, 185, 129, 0.25)'
              }}>
                Customer Directory & Privacy Hub
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
              Enterprise accounts powered by ShiftPe at scale, volume telemetry, data protection standards, and SLA policies.
            </p>
          </div>
        </div>

        {isExecutive && (
          <button
            onClick={openCreateModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: 'var(--shiftpe-coral)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 2px 10px var(--shiftpe-coral-glow)',
              cursor: 'pointer',
              transition: 'var(--transition)'
            }}
          >
            <Plus size={16} />
            <span>Add Customer / Wiki Doc</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['All', 'Enterprise Customer', 'Case Study', 'Privacy & Compliance', 'Operations & SLA'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '7px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12.5px',
                fontWeight: 600,
                backgroundColor: selectedCategory === cat ? 'var(--shiftpe-coral)' : 'var(--panel)',
                color: selectedCategory === cat ? '#ffffff' : 'var(--muted)',
                border: selectedCategory === cat ? '1px solid var(--shiftpe-coral)' : '1px solid var(--line)',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              {cat === 'All' ? 'All Documentation' : cat}
            </button>
          ))}
        </div>

        {/* Search & Tier dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--subtle)' }} />
            <input
              type="text"
              placeholder="Search customers, scale, policy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text)',
                fontSize: '12.5px'
              }}
            />
          </div>

          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text)',
              fontSize: '12.5px'
            }}
          >
            <option value="All">All Shift Volumes</option>
            <option value="Enterprise (10k+ shifts)">Enterprise (10k+ shifts)</option>
            <option value="Growth (2k-10k shifts)">Growth (2k-10k shifts)</option>
            <option value="Pilot (<2k shifts)">Pilot (&lt;2k shifts)</option>
          </select>
        </div>
      </div>

      {/* Grid of Wiki & Customer Cards */}
      {isLoading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>
          <div className="spin" style={{ width: '28px', height: '28px', border: '2px solid var(--shiftpe-coral)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px' }} />
          <span>Loading ShiftPe Enterprise Directory...</span>
        </div>
      ) : articles.length === 0 ? (
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          backgroundColor: 'var(--panel)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--line)',
          color: 'var(--muted)'
        }}>
          <Building2 size={36} color="var(--shiftpe-coral)" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>No wiki documents found</h3>
          <p style={{ fontSize: '12.5px', marginTop: '4px' }}>Try adjusting your search query or filter category.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px' }}>
          {articles.map(article => {
            const isCustomer = article.isCustomerCase && article.customerDetails;
            const isExecOnly = article.visibility === 'executive_only';

            return (
              <div
                key={article._id}
                onClick={() => setSelectedArticle(article)}
                style={{
                  backgroundColor: 'var(--panel)',
                  border: isExecOnly ? '1px solid var(--shiftpe-coral-border)' : '1px solid var(--line)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '22px 24px',
                  boxShadow: isExecOnly ? 'var(--card-glow)' : 'var(--card-shadow)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'var(--transition)',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'var(--shiftpe-coral)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = isExecOnly ? 'var(--shiftpe-coral-border)' : 'var(--line)';
                }}
              >
                {/* Top Badges */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--surface-pill)',
                        color: 'var(--muted)'
                      }}>
                        {article.category}
                      </span>

                      {article.pinned && (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-amber)' }}>
                          ★ Pinned
                        </span>
                      )}
                    </div>

                    {/* RBAC Visibility Badge */}
                    {isExecOnly ? (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'rgba(255, 95, 85, 0.14)',
                        color: 'var(--shiftpe-coral)',
                        border: '1px solid var(--shiftpe-coral-border)'
                      }}>
                        <Lock size={11} />
                        <span>Executive Only</span>
                      </span>
                    ) : (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        color: 'var(--accent-green)'
                      }}>
                        <Globe size={11} />
                        <span>Company Wide</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Customer Name */}
                  <h3 style={{ fontSize: '16.5px', fontWeight: 800, color: 'var(--text)', lineHeight: 1.35, marginBottom: '6px' }}>
                    {article.title}
                  </h3>

                  {isCustomer && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--shiftpe-coral)' }}>
                        {article.customerDetails?.companyName}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--subtle)' }}>•</span>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        {article.customerDetails?.industry}
                      </span>
                    </div>
                  )}

                  {/* Scale Metric Pill */}
                  {isCustomer && (
                    <div style={{
                      margin: '10px 0 14px 0',
                      padding: '8px 12px',
                      backgroundColor: 'var(--surface-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--line)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={14} color="var(--shiftpe-coral)" />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>
                          {article.customerDetails?.scaleMetric}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--subtle)' }}>
                        {article.customerDetails?.tier}
                      </span>
                    </div>
                  )}

                  <p style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '14px' }}>
                    {article.summary}
                  </p>
                </div>

                {/* Bottom Footer Details */}
                <div style={{
                  paddingTop: '12px',
                  borderTop: '1px solid var(--line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11.5px',
                  color: 'var(--subtle)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isCustomer && article.customerDetails?.privacyPolicyUrl ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-blue)', fontWeight: 600 }}>
                        <Shield size={12} />
                        <span>Privacy Policy Verified</span>
                      </span>
                    ) : (
                      <span>By {article.authorName}</span>
                    )}
                  </div>

                  <span style={{ color: 'var(--shiftpe-coral)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Read Details</span>
                    <span>&rarr;</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Article Detail View Modal */}
      {selectedArticle && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(7, 11, 24, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '820px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 28px',
              borderBottom: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--surface-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--shiftpe-coral-light)',
                  color: 'var(--shiftpe-coral)'
                }}>
                  {selectedArticle.category}
                </span>

                {selectedArticle.visibility === 'executive_only' && (
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(255, 95, 85, 0.15)',
                    color: 'var(--shiftpe-coral)',
                    border: '1px solid var(--shiftpe-coral-border)'
                  }}>
                    <Lock size={11} />
                    <span>Executive Only Document</span>
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isExecutive && (
                  <>
                    <button
                      onClick={() => {
                        const target = selectedArticle;
                        setSelectedArticle(null);
                        openEditModal(target);
                      }}
                      title="Edit Document"
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'var(--surface-subtle)',
                        border: '1px solid var(--line)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDelete(selectedArticle._id)}
                      title="Delete Document"
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'rgba(255, 95, 85, 0.1)',
                        border: '1px solid rgba(255, 95, 85, 0.25)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--shiftpe-coral)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => setSelectedArticle(null)}
                  style={{
                    padding: '6px',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--muted)',
                    cursor: 'pointer'
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '28px', overflowY: 'auto' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
                {selectedArticle.title}
              </h2>

              {selectedArticle.isCustomerCase && selectedArticle.customerDetails && (
                <div style={{
                  margin: '18px 0',
                  padding: '16px 20px',
                  backgroundColor: 'var(--surface-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--line)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '14px'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--subtle)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Enterprise Client
                    </div>
                    <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--shiftpe-coral)', marginTop: '2px' }}>
                      {selectedArticle.customerDetails.companyName}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {selectedArticle.customerDetails.industry}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--subtle)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Deployment Scale & Tier
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)', marginTop: '2px' }}>
                      {selectedArticle.customerDetails.scaleMetric}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--accent-green)', fontWeight: 600 }}>
                      {selectedArticle.customerDetails.tier}
                    </div>
                  </div>

                  {selectedArticle.customerDetails.slaTerms && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ fontSize: '11px', color: 'var(--subtle)', fontWeight: 600, textTransform: 'uppercase' }}>
                        Service Level Agreement (SLA)
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'var(--text)', fontWeight: 600, marginTop: '2px' }}>
                        {selectedArticle.customerDetails.slaTerms}
                      </div>
                    </div>
                  )}

                  {selectedArticle.customerDetails.privacyPolicyUrl && (
                    <div style={{ gridColumn: 'span 2', paddingTop: '8px', borderTop: '1px solid var(--line)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--subtle)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                        Customer Privacy Policy & Legal Architecture
                      </div>
                      <p style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.45, marginBottom: '6px' }}>
                        {selectedArticle.customerDetails.privacyPolicySummary || 'Standard enterprise data processing agreement (DPA) enforced under Indian DPDP Act.'}
                      </p>
                      <a
                        href={selectedArticle.customerDetails.privacyPolicyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: 'var(--accent-blue)'
                        }}
                      >
                        <span>Official Privacy Policy Document</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}

                  {selectedArticle.customerDetails.activeCities && selectedArticle.customerDetails.activeCities.length > 0 && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ fontSize: '11px', color: 'var(--subtle)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                        Active Operational Hubs
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {selectedArticle.customerDetails.activeCities.map(city => (
                          <span
                            key={city}
                            style={{
                              fontSize: '11.5px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--surface-pill)',
                              color: 'var(--text)',
                              fontWeight: 500
                            }}
                          >
                            📍 {city}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Markdown Content */}
              <div style={{
                fontSize: '13.5px',
                color: 'var(--text)',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                fontFamily: 'var(--font-sans)',
                marginTop: '16px'
              }}>
                {selectedArticle.content}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal (CEO & Founder Only) */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(7, 11, 24, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '760px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--surface-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BookOpen size={18} color="var(--shiftpe-coral)" />
                <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)' }}>
                  {editingArticle ? 'Edit Wiki Document' : 'Publish Customer / Wiki Document'}
                </h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {actionMessage && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: actionMessage.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 95, 85, 0.12)',
                  color: actionMessage.type === 'success' ? 'var(--accent-green)' : 'var(--shiftpe-coral)',
                  fontSize: '12.5px',
                  fontWeight: 600
                }}>
                  {actionMessage.text}
                </div>
              )}

              {/* Title & Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                    Document Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zomato Hyperlocal Logistics Fleet"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: 'var(--surface-subtle)',
                      border: '1px solid var(--line)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text)',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: 'var(--surface-subtle)',
                      border: '1px solid var(--line)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text)',
                      fontSize: '13px'
                    }}
                  >
                    <option value="Enterprise Customer">Enterprise Customer</option>
                    <option value="Case Study">Case Study</option>
                    <option value="Privacy & Compliance">Privacy & Compliance</option>
                    <option value="Operations & SLA">Operations & SLA</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              {/* Customer Details Section */}
              <div style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface-subtle)',
                border: '1px solid var(--line)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                    Customer Account Telemetry
                  </span>
                  <label style={{ fontSize: '12px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isCustomerCase}
                      onChange={(e) => setIsCustomerCase(e.target.checked)}
                    />
                    <span>Is this a Customer Profile?</span>
                  </label>
                </div>

                {isCustomerCase && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--subtle)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        Company Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Zomato"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          backgroundColor: 'var(--panel)',
                          border: '1px solid var(--line)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text)',
                          fontSize: '12.5px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--subtle)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        Scale Metric *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 35,000+ shifts/month"
                        value={scaleMetric}
                        onChange={(e) => setScaleMetric(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          backgroundColor: 'var(--panel)',
                          border: '1px solid var(--line)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text)',
                          fontSize: '12.5px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--subtle)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        Industry *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Food Delivery & Q-Commerce"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          backgroundColor: 'var(--panel)',
                          border: '1px solid var(--line)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text)',
                          fontSize: '12.5px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--subtle)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        Customer Tier
                      </label>
                      <select
                        value={tier}
                        onChange={(e) => setTier(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          backgroundColor: 'var(--panel)',
                          border: '1px solid var(--line)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text)',
                          fontSize: '12.5px'
                        }}
                      >
                        <option value="Enterprise (10k+ shifts)">Enterprise (10k+ shifts)</option>
                        <option value="Growth (2k-10k shifts)">Growth (2k-10k shifts)</option>
                        <option value="Pilot (<2k shifts)">Pilot (&lt;2k shifts)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--subtle)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        Privacy Policy URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={privacyPolicyUrl}
                        onChange={(e) => setPrivacyPolicyUrl(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          backgroundColor: 'var(--panel)',
                          border: '1px solid var(--line)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text)',
                          fontSize: '12.5px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--subtle)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        Active Cities (comma separated)
                      </label>
                      <input
                        type="text"
                        placeholder="Delhi, Mumbai, Bengaluru"
                        value={activeCities}
                        onChange={(e) => setActiveCities(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          backgroundColor: 'var(--panel)',
                          border: '1px solid var(--line)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text)',
                          fontSize: '12.5px'
                        }}
                      />
                    </div>

                    <div style={{ gridColumn: 'span 3' }}>
                      <label style={{ fontSize: '11px', color: 'var(--subtle)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        Privacy Policy & Legal Summary
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Strict client worker privacy; localized to AWS Mumbai; DPDP 2023 compliant"
                        value={privacyPolicySummary}
                        onChange={(e) => setPrivacyPolicySummary(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          backgroundColor: 'var(--panel)',
                          border: '1px solid var(--line)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text)',
                          fontSize: '12.5px'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Short Summary */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                  Brief Summary *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Overview of shift deployment volumes and operations"
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    backgroundColor: 'var(--surface-subtle)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text)',
                    fontSize: '13px'
                  }}
                />
              </div>

              {/* Detailed Markdown Content */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                  Detailed Documentation Body *
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Write full details, operational procedures, SLA clauses, contact escalation paths..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    backgroundColor: 'var(--surface-subtle)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text)',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Executive Access Restriction Switch */}
              <div style={{
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: formVisibility === 'executive_only' ? 'rgba(255, 95, 85, 0.12)' : 'var(--surface-subtle)',
                border: formVisibility === 'executive_only' ? '1px solid var(--shiftpe-coral-border)' : '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13px', color: formVisibility === 'executive_only' ? 'var(--shiftpe-coral)' : 'var(--text)' }}>
                    {formVisibility === 'executive_only' ? <Lock size={15} /> : <Globe size={15} />}
                    <span>{formVisibility === 'executive_only' ? 'Executive Only Classification' : 'Company Wide Access'}</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
                    {formVisibility === 'executive_only'
                      ? 'Restricted strictly to CEO & Founders. Hidden completely from regular team members.'
                      : 'All ShiftPe team members can view this document in the Wiki.'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setFormVisibility('everyone')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      fontWeight: 700,
                      backgroundColor: formVisibility === 'everyone' ? 'var(--accent-green)' : 'var(--panel)',
                      color: formVisibility === 'everyone' ? '#ffffff' : 'var(--muted)',
                      border: '1px solid var(--line)',
                      cursor: 'pointer'
                    }}
                  >
                    Everyone
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormVisibility('executive_only')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      fontWeight: 700,
                      backgroundColor: formVisibility === 'executive_only' ? 'var(--shiftpe-coral)' : 'var(--panel)',
                      color: formVisibility === 'executive_only' ? '#ffffff' : 'var(--muted)',
                      border: '1px solid var(--shiftpe-coral-border)',
                      cursor: 'pointer'
                    }}
                  >
                    CEO & Founder Only
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--line)',
                    backgroundColor: 'transparent',
                    color: 'var(--muted)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    padding: '9px 24px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--shiftpe-coral)',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 10px var(--shiftpe-coral-glow)'
                  }}
                >
                  {isSaving ? 'Saving...' : editingArticle ? 'Update Document' : 'Publish to Wiki'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
