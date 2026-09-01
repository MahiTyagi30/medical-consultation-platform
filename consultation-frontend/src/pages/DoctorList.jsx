import { useEffect, useState } from 'react';
import API from '../api';

export default function DoctorList() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');

  useEffect(() => {
    API.get('/doctors')
      .then((res) => setDoctors(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handleBook = async (e) => {
    e.preventDefault();
    try {
      await API.post('/appointments/book', {
        doctorId: selectedDoctor,
        patientId: 1, // Default test patient ID
        appointmentDate,
      });
      alert('Appointment booked successfully!');
    } catch (err) {
      console.error(err);
      alert('Booking failed.');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '30px auto', fontFamily: 'sans-serif' }}>
      <h3>Available Doctors & Appointment Booking</h3>
      <form onSubmit={handleBook}>
        <label>Select Doctor:</label>
        <select
          value={selectedDoctor}
          onChange={(e) => setSelectedDoctor(e.target.value)}
          required
          style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
        >
          <option value="">-- Choose a Doctor --</option>
          {doctors.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.name} - {doc.specialization || 'General'}
            </option>
          ))}
        </select>

        <label>Date and Time:</label>
        <input
          type="datetime-local"
          value={appointmentDate}
          onChange={(e) => setAppointmentDate(e.target.value)}
          required
          style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
        />

        <button type="submit" style={{ padding: '8px 16px', background: '#28a745', color: '#fff', border: 'none' }}>
          Book Appointment
        </button>
      </form>
    </div>
  );
}