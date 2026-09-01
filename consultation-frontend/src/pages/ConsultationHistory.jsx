import  { useState, useEffect } from 'react';
import API from '../api';

export default function ConsultationHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [expandedIds, setExpandedIds] = useState({});

  useEffect(() => {
    let isMounted = true;

    API.get('/assessments/my-history')
      .then((res) => {
        if (isMounted) {
          setHistory(res.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load consultation history:', err);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleExpand = (id) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDownloadPdf = async (e, id) => {
    e.stopPropagation(); // Prevents card collapse when clicking the button
    setDownloadingId(id);
    try {
      const response = await API.get(`/pdf/doctor-report/${id}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Clinical_Report_INT-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('Could not download PDF report. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading past consultations...</div>;
  }

  return (
    <div style={styles.container}>
      <h2>📋 Past Consultations</h2>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>
        View your past intake assessments and click any card to expand full details.
      </p>

      {history.length === 0 ? (
        <div style={styles.emptyCard}>
          <p>No past consultations found. Complete a Voice Intake session to see records here.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {history.map((item) => {
            const isExpanded = !!expandedIds[item.id];

            return (
              <div key={item.id} style={styles.card}>
                {/* CARD HEADER / PREVIEW (CLICKABLE) */}
                <div style={styles.cardHeader} onClick={() => toggleExpand(item.id)}>
                  <div>
                    <span style={styles.idBadge}>Intake #{item.id}</span>
                    <span style={styles.dateText}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={item.status === 'REVIEWED' ? styles.badgeGreen : styles.badgeYellow}>
                      {item.status === 'REVIEWED' ? '✓ Reviewed' : '⏳ Pending Review'}
                    </span>
                    <button style={styles.expandToggleBtn}>
                      {isExpanded ? 'Hide Details ▲' : 'Show Details 🔽'}
                    </button>
                  </div>
                </div>

                {/* COMPACT SUMMARY PREVIEW */}
                <div style={{ padding: '0 16px 12px 16px', cursor: 'pointer' }} onClick={() => toggleExpand(item.id)}>
                  <strong>Primary Symptoms:</strong>
                  <p style={{ margin: '4px 0 0 0', color: '#1f2937', fontWeight: '500' }}>
                    {item.symptoms || 'Not reported'}
                  </p>

                  {/* Quick Doctor Note Snippet in Preview mode */}
                  {!isExpanded && item.doctorNotes && (
                    <div style={styles.doctorNotesPreview}>
                      <small style={{ color: '#065f46', fontWeight: 'bold' }}>
                        👨‍⚕️ Doctor Remark: {item.doctorNotes.length > 90 ? item.doctorNotes.substring(0, 90) + '...' : item.doctorNotes}
                      </small>
                    </div>
                  )}
                </div>

                {/* EXPANDABLE FULL DETAILS SECTION */}
                {isExpanded && (
                  <div style={styles.expandedContent}>
                    {/* AI Clinical Summary */}
                    <div style={styles.sectionBox}>
                      <strong>AI Clinical Summary:</strong>
                      <pre style={styles.preText}>{item.aiSummary || 'No summary available.'}</pre>
                    </div>

                    {/* Full Patient Transcript */}
                    {item.patientAnswers && (
                      <div style={styles.sectionBox}>
                        <strong>Patient Transcript:</strong>
                        <p style={{ fontStyle: 'italic', color: '#4b5563', margin: '6px 0 0 0' }}>
                          {item.patientAnswers}
                        </p>
                      </div>
                    )}

                    {/* Full Doctor Remarks */}
                    {item.doctorNotes ? (
                      <div style={styles.doctorNotesBox}>
                        <strong style={{ color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          👨‍⚕️ Doctor's Full Remarks & Directives:
                        </strong>
                        <p style={styles.doctorNotesText}>{item.doctorNotes}</p>
                      </div>
                    ) : (
                      <div style={styles.pendingBox}>
                        <small style={{ color: '#92400e' }}>
                          ℹ️ A doctor has not reviewed this record yet.
                        </small>
                      </div>
                    )}
                  </div>
                )}

                {/* CARD FOOTER ACTIONS */}
                <div style={styles.actions}>
                  <button
                    style={styles.pdfBtn}
                    onClick={(e) => handleDownloadPdf(e, item.id)}
                    disabled={downloadingId === item.id}
                  >
                    {downloadingId === item.id ? 'Generating PDF...' : '📄 Download Doctor PDF Report'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '850px', margin: '30px auto', padding: '0 20px', fontFamily: 'sans-serif' },
  emptyCard: { padding: '30px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb', color: '#6b7280' },
  list: { display: 'flex', flexDirection: 'column', gap: '16px' },
  card: { border: '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.04)', overflow: 'hidden' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' },
  idBadge: { fontWeight: 'bold', fontSize: '15px', color: '#0f172a', marginRight: '12px' },
  dateText: { color: '#64748b', fontSize: '13px' },
  badgeYellow: { backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '14px', fontSize: '12px', fontWeight: 'bold' },
  badgeGreen: { backgroundColor: '#d1fae5', color: '#059669', padding: '4px 10px', borderRadius: '14px', fontSize: '12px', fontWeight: 'bold' },
  expandToggleBtn: { border: 'none', background: 'transparent', color: '#2563eb', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' },
  doctorNotesPreview: { marginTop: '8px', padding: '6px 10px', backgroundColor: '#ecfdf5', borderRadius: '6px', border: '1px solid #a7f3d0' },
  expandedContent: { padding: '16px', borderTop: '1px solid #f1f5f9', backgroundColor: '#ffffff' },
  sectionBox: { backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #f3f4f6', marginBottom: '12px' },
  preText: { whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: '6px 0 0 0', color: '#374151', fontSize: '14px' },
  doctorNotesBox: { backgroundColor: '#ecfdf5', padding: '14px', borderRadius: '8px', border: '1px solid #a7f3d0', marginTop: '12px' },
  doctorNotesText: { margin: '6px 0 0 0', color: '#064e3b', fontSize: '14px', fontWeight: '500' },
  pendingBox: { backgroundColor: '#fffbeb', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fde68a', marginTop: '12px' },
  actions: { padding: '12px 16px', backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' },
  pdfBtn: { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' },
};