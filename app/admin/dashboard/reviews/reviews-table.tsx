'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { updateReviewStatus, deleteReview, getReviewById } from '@/app/actions/reviews';
import { useWebSocket } from '@/lib/realtime';
import type { WebSocketMessage } from '@/lib/realtime';

interface Review {
  _id: string;
  name: string;
  designation?: string;
  review: string;
  image?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export function ReviewsTable({ initialReviews }: { initialReviews: Review[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const { status: wsStatus, send, subscribe } = useWebSocket();
  const hasAuthenticated = useRef(false);

  // Authenticate as admin on connection
  useEffect(() => {
    if (wsStatus === 'connected' && !hasAuthenticated.current) {
      send({ type: 'auth:admin' });
      hasAuthenticated.current = true;
    }
    if (wsStatus === 'disconnected') {
      hasAuthenticated.current = false;
    }
  }, [wsStatus, send]);

  // Handle WebSocket messages
  const handleMessage = useCallback((msg: WebSocketMessage) => {
    if (msg.type === 'review:new') {
      // Fetch full review data, then add to state
      getReviewById(msg.payload.id).then((full) => {
        if (full) {
          setReviews((prev) => {
            if (prev.some((r) => r._id === full._id)) return prev;
            return [full, ...prev];
          });
          showToast(`New review from ${msg.payload.name}`);
        }
      }).catch(() => {});
    }

    if (msg.type === 'review:approved') {
      setReviews((prev) =>
        prev.map((r) =>
          r._id === msg.payload.id ? { ...r, status: 'approved' as const } : r
        )
      );
    }

    if (msg.type === 'review:rejected') {
      setReviews((prev) =>
        prev.map((r) =>
          r._id === msg.payload.id ? { ...r, status: 'rejected' as const } : r
        )
      );
    }
  }, []);

  useEffect(() => {
    const unsub = subscribe(handleMessage);
    return () => unsub();
  }, [subscribe, handleMessage]);

  // Toast auto-dismiss
  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  }

  const filtered = filter === 'all' ? reviews : reviews.filter((r) => r.status === filter);
  const pendingCount = reviews.filter((r) => r.status === 'pending').length;

  const handleApprove = async (id: string) => {
    setLoading(id);
    try {
      await updateReviewStatus(id, 'approved');
      setReviews((prev) => prev.map((r) => r._id === id ? { ...r, status: 'approved' as const } : r));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
    setLoading(null);
  };

  const handleReject = async (id: string) => {
    setLoading(id);
    try {
      await updateReviewStatus(id, 'rejected');
      setReviews((prev) => prev.map((r) => r._id === id ? { ...r, status: 'rejected' as const } : r));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
    setLoading(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return;
    setLoading(id);
    try {
      await deleteReview(id);
      setReviews((prev) => prev.filter((r) => r._id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
    setLoading(null);
  };

  const statusBadge = (status: string) => {
    const cls = status === 'approved' ? 'badge badge-green' : status === 'rejected' ? 'badge badge-red' : 'badge badge-yellow';
    return <span className={cls}>{status}</span>;
  };

  const connectionDot = () => {
    const color = wsStatus === 'connected' ? 'var(--success)' : wsStatus === 'reconnecting' ? 'var(--warning)' : 'var(--text-3)';
    return (
      <span
        title={`WebSocket: ${wsStatus}`}
        style={{
          display: 'inline-block',
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: color,
          marginLeft: 8,
          verticalAlign: 'middle',
        }}
      />
    );
  };

  return (
    <div>
      {toast && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        {['all', 'pending', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {s === 'pending' && ` (${pendingCount})`}
          </button>
        ))}
        {connectionDot()}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">No reviews found.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Designation</th>
                <th>Review</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((review) => (
                <tr key={review._id} style={{ opacity: loading === review._id ? 0.5 : 1 }}>
                  <td style={{ fontWeight: 500 }}>{review.name}</td>
                  <td>{review.designation || '—'}</td>
                  <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {review.review}
                  </td>
                  <td>{statusBadge(review.status)}</td>
                  <td>{new Date(review.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {review.status !== 'approved' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => handleApprove(review._id)} disabled={!!loading}>
                          Approve
                        </button>
                      )}
                      {review.status !== 'rejected' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => handleReject(review._id)} disabled={!!loading}>
                          Reject
                        </button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(review._id)} disabled={!!loading}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
