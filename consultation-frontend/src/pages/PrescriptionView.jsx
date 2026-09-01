import { useState } from 'react';
import API from '../api';

export default function PrescriptionView() {
  const [appointmentId, setAppointmentId] = useState('');
  const [prescription, setPrescription] = useState(null);

  const fetchPrescription = async () => {
    try {
      const res = await API.get(`/prescriptions/appointment/${appointmentId}`);
      setPrescription(res.data);
    } catch (err) {
      console.error(err);
      alert('Prescription not found');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '30px auto', fontFamily: 'sans-serif' }}>
      <h3>View Digital Prescription</h3>
      <input
        type="number"
        placeholder="Enter Appointment ID"
        value={appointmentId}
        onChange={(e) => setAppointmentId(e.target.value)}
        style={{ width: '70%', padding: '8px', marginRight: '5px' }}
      />
      <button onClick={fetchPrescription} style={{ padding: '8px 12px' }}>Search</button>

      {prescription && (
        <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
          <h4>Diagnosis: {prescription.diagnosis}</h4>
          <p><strong>Medicines:</strong> {prescription.medicines}</p>
          <p><strong>Instructions:</strong> {prescription.adviceInstructions}</p>
          <small>Issued at: {new Date(prescription.issuedAt).toLocaleString()}</small>
        </div>
      )}
    </div>
  );
}