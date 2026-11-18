import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Network, Shield } from 'lucide-react';

interface OrgMember {
  _id: string;
  name: string;
  email: string;
  designation: string;
  domain: string;
  role: 'member' | 'manager' | 'ceo' | 'founder';
  reportsTo: string | null;
  phone?: string;
  children?: OrgMember[];
}

export const OrgTreeView: React.FC = () => {
  const { token } = useAuth();
  const [treeRoots, setTreeRoots] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTree = async () => {
      try {
        const res = await fetch('/api/users/tree', {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          const members: OrgMember[] = data.users;

          // Build recursive tree
          const memberMap = new Map<string, OrgMember>();
          members.forEach((m) => memberMap.set(m._id, { ...m, children: [] }));

          const roots: OrgMember[] = [];
          members.forEach((m) => {
            const mapped = memberMap.get(m._id)!;
            const parentId = m.reportsTo ? m.reportsTo.toString() : null;
            if (parentId && memberMap.has(parentId)) {
              memberMap.get(parentId)!.children!.push(mapped);
            } else {
              roots.push(mapped);
            }
          });

          roots.sort((a, b) => {
            const roleScore = (r: string) => r === 'founder' ? 3 : r === 'ceo' ? 2 : r === 'manager' ? 1 : 0;
            return roleScore(b.role) - roleScore(a.role);
          });

          setTreeRoots(roots);
        }
      } catch (err) {
        console.error('Failed to load org tree:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTree();
  }, [token]);

  const renderNode = (node: OrgMember, depth = 0) => {
    const isExecutive = node.role === 'ceo' || node.role === 'founder';
    return (
      <div key={node._id} style={{ marginLeft: depth > 0 ? '28px' : '0px', marginTop: '12px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 18px',
          backgroundColor: node.role === 'founder' ? 'rgba(255, 95, 85, 0.08)' : node.role === 'ceo' ? '#18122c' : 'var(--panel)',
          border: '1px solid',
          borderColor: node.role === 'founder' ? 'var(--shiftpe-coral-border)' : node.role === 'ceo' ? 'var(--accent-purple)' : 'var(--line)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          minWidth: '280px'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: node.role === 'founder' ? 'var(--shiftpe-coral)' : node.role === 'ceo' ? 'var(--accent-purple)' : node.role === 'manager' ? '#38bdf8' : 'var(--accent-blue)',
            color: '#fff',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px'
          }}>
            {node.name.charAt(0).toUpperCase()}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                {node.name}
              </span>
              {isExecutive && <Shield size={14} color="var(--shiftpe-coral)" />}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              {node.designation} &bull; <span style={{ color: 'var(--shiftpe-coral)' }}>{node.domain}</span>
            </div>
          </div>
        </div>

        {node.children && node.children.length > 0 && (
          <div style={{
            borderLeft: '2px dashed var(--line)',
            marginLeft: '18px',
            paddingLeft: '14px'
          }}>
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Network size={24} color="var(--accent-green)" />
          <span>Organisation Structure</span>
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: '13.5px', marginTop: '4px' }}>
          Real-time reporting hierarchy mapping team members to managers and executive leadership.
        </p>
      </div>

      <div style={{
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
        overflowX: 'auto'
      }}>
        {loading ? (
          <div style={{ color: 'var(--muted)', fontSize: '13px' }}>Constructing organizational tree...</div>
        ) : treeRoots.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: '13px' }}>No active organizational hierarchy found.</div>
        ) : (
          <div>
            {treeRoots.map((root) => renderNode(root))}
          </div>
        )}
      </div>
    </div>
  );
};
