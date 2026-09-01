import { useState, useEffect } from 'react';
import API from '../api';

export default function DoctorDashboard() {
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Helper function to fetch assessments
  const loadData = async () => {
    try {
      const res = await API.get('/assessments/doctor/all');
      setAssessments(res.data);
    } catch (err) {
     console.error('Failed to submit doctor review:', err);
      alert('Failed to submit doctor review.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    API.get('/assessments/doctor/all')
      .then((res) => {
        if (isMounted) {
          setAssessments(res.data);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch patient intakes:', err);
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

  const handleOpenReview = (item) => {
    setSelectedAssessment(item);
    setDoctorNotes(item.doctorNotes || '');
  };

  const handleSubmitReview = async (status = 'REVIEWED') => {
    if (!selectedAssessment) return;
    setSaving(true);
    try {
      await API.put(`/assessments/${selectedAssessment.id}/review`, {
        doctorNotes,
        status,
      });
      alert('Review submitted successfully!');
      setSelectedAssessment(null);
      loadData();
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert('Failed to submit doctor review.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading Patient Intakes...</div>;
  }

  return (
    <div style={styles.container}>
      <h2>Doctor Review Dashboard</h2>
      <p style={{ color: '#6b7280' }}>Review AI-generated intake summaries and add clinical notes.</p>

      <div style={styles.grid}>
        {assessments.map((item) => (
          <div key={item.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.symptomTitle}>{item.symptoms || 'Primary Symptoms Unspecified'}</span>
              <span style={item.status === 'REVIEWED' ? styles.badgeGreen : styles.badgeYellow}>
                {item.status}
              </span>
            </div>
            <p style={styles.dateText}>
              Intake Date: {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A'}
            </p>
            <p style={styles.summarySnippet}>
              <strong>AI Summary Snippet:</strong>{' '}
              {item.aiSummary ? item.aiSummary.substring(0, 120) + '...' : 'N/A'}
            </p>
            <button style={styles.reviewBtn} onClick={() => handleOpenReview(item)}>
              🔍 Review & Add Notes
            </button>
          </div>
        ))}
      </div>

      {/* REVIEW MODAL */}
      {selectedAssessment && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Review Patient Intake #{selectedAssessment.id}</h3>
            <p>
              <strong>Chief Symptoms:</strong> {selectedAssessment.symptoms}
            </p>

            <div style={styles.sectionBox}>
              <strong>AI Clinical Summary:</strong>
              <pre style={styles.preText}>{selectedAssessment.aiSummary}</pre>
            </div>

            <div style={styles.sectionBox}>
              <strong>Patient Raw Transcript:</strong>
              <p style={{ fontStyle: 'italic', color: '#4b5563', marginTop: '8px' }}>
                {selectedAssessment.patientAnswers || 'No transcript recorded.'}
              </p>
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                Doctor Notes & Directives:
              </label>
              <textarea
                rows={4}
                style={styles.textarea}
                placeholder="Enter clinical observations, prescription directives, or follow-up instructions..."
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
              />
            </div>

            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setSelectedAssessment(null)}>
                Cancel
              </button>
              <button
                style={styles.saveBtn}
                onClick={() => handleSubmitReview('REVIEWED')}
                disabled={saving}
              >
                {saving ? 'Saving...' : '✓ Finalize Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '1000px', margin: '30px auto', padding: '0 20px', fontFamily: 'sans-serif' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' },
  card: { border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  symptomTitle: { fontWeight: 'bold', color: '#111827', fontSize: '16px' },
  badgeYellow: { backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
  badgeGreen: { backgroundColor: '#d1fae5', color: '#059669', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
  dateText: { color: '#9ca3af', fontSize: '12px', marginBottom: '12px' },
  summarySnippet: { fontSize: '14px', color: '#4b5563', marginBottom: '16px' },
  reviewBtn: { width: '100%', backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#fff', padding: '24px', borderRadius: '12px', maxWidth: '650px', width: '90%', maxHeight: '90vh', overflowY: 'auto' },
  sectionBox: { backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #f3f4f6', marginTop: '12px' },
  preText: { whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: '8px 0 0 0', color: '#374151', fontSize: '14px' },
  textarea: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontFamily: 'inherit', boxSizing: 'border-box' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
  cancelBtn: { padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer' },
  saveBtn: { padding: '8px 16px', border: 'none', borderRadius: '6px', backgroundColor: '#059669', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
};