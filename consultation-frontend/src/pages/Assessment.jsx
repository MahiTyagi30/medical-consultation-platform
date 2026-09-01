import { useState } from 'react';
import API from '../api';

export default function Assessment({ appointmentId = 1 }) {
  const [symptoms, setSymptoms] = useState('');
  const [answers, setAnswers] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/assessments/submit', {
        appointmentId,
        primarySymptoms: symptoms,
        patientAnswers: answers,
      });
      setResult(res.data);
    } catch  {
      alert('Error submitting assessment');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '30px auto', fontFamily: 'sans-serif' }}>
      <h3>AI Pre-Consultation Intake</h3>
      <form onSubmit={handleSubmit}>
        <label>Primary Symptoms:</label>
        <textarea
          rows="3"
          style={{ width: '100%', marginBottom: '10px' }}
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder="e.g., Fever, headache for 2 days"
          required
        />
        <label>Additional Context / Medical History:</label>
        <textarea
          rows="3"
          style={{ width: '100%', marginBottom: '10px' }}
          value={answers}
          onChange={(e) => setAnswers(e.target.value)}
          placeholder="e.g., Taking paracetamol, no allergies"
        />
        <button type="submit" style={{ padding: '8px 16px' }}>Generate AI Assessment</button>
      </form>

      {result && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#f0f4f8', borderRadius: '5px' }}>
          <h4>AI Generated Clinical Summary:</h4>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{result.aiSummary}</pre>
        </div>
      )}
    </div>
  );
}