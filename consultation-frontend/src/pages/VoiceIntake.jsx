import { useState, useEffect } from 'react';
import API from '../api';

export default function VoiceIntake() {

  // ============================================================
  // STATE
  // ============================================================

  const [aiQuestion, setAiQuestion] = useState(
    "Hello! Please state the primary symptoms you are experiencing today."
  );

  const [userSaid, setUserSaid] = useState("");

  // Transcript waiting for patient confirmation
  const [pendingTranscript, setPendingTranscript] = useState("");

  const [conversation, setConversation] = useState([]);

  const [isListening, setIsListening] = useState(false);

  const [isComplete, setIsComplete] = useState(false);

  const [assessmentId, setAssessmentId] = useState(null);

  const [loading, setLoading] = useState(false);


  // ============================================================
  // TEXT TO SPEECH
  // ============================================================

  const speakText = (text) => {

    if ('speechSynthesis' in window) {

      // Stop any previous speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      window.speechSynthesis.speak(utterance);
    }
  };


  // ============================================================
  // SPEAK INITIAL QUESTION
  // ============================================================

  useEffect(() => {

    speakText(aiQuestion);

    return () => {

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

    };

  }, []);


  // ============================================================
  // START VOICE RECOGNITION
  // ============================================================

  const startListening = () => {

    if (isComplete || loading) {
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    // Browser support check
    if (!SpeechRecognition) {

      alert(
        "Your browser does not support Web Speech API. " +
        "Please use Google Chrome or Microsoft Edge."
      );

      return;
    }

    const recognition = new SpeechRecognition();


    // ==========================================================
    // SPEECH RECOGNITION SETTINGS
    // ==========================================================

    // Indian English
    recognition.lang = 'en-IN';

    // Only return final results
    recognition.interimResults = false;

    // Only use the best result
    recognition.maxAlternatives = 1;


    // ==========================================================
    // WHEN LISTENING STARTS
    // ==========================================================

    recognition.onstart = () => {

      console.log("Speech recognition started");

      setIsListening(true);

      setUserSaid("");

      setPendingTranscript("");
    };


    // ==========================================================
    // WHEN SPEECH IS RECOGNIZED
    // ==========================================================

    recognition.onresult = (event) => {

      const transcript =
        event.results[0][0].transcript.trim();


      console.log(
        "Speech recognition result:",
        transcript
      );


      // Ignore empty transcript
      if (!transcript) {
        return;
      }


      // --------------------------------------------------------
      // Show transcript to patient for review
      // --------------------------------------------------------

      setUserSaid(transcript);

      setPendingTranscript(transcript);
    };


    // ==========================================================
    // SPEECH RECOGNITION ERROR
    // ==========================================================

    recognition.onerror = (event) => {

      console.error(
        "Speech recognition error:",
        event.error
      );

      setIsListening(false);

      if (event.error === 'not-allowed') {

        alert(
          "Microphone permission was denied. " +
          "Please allow microphone access in your browser."
        );

      } else if (event.error === 'no-speech') {

        alert(
          "No speech was detected. " +
          "Please try speaking again."
        );

      } else if (event.error === 'audio-capture') {

        alert(
          "No microphone was detected. " +
          "Please check your microphone."
        );

      } else if (event.error === 'network') {

        alert(
          "Speech recognition network error. " +
          "Please check your internet connection."
        );
      }
    };


    // ==========================================================
    // WHEN RECOGNITION ENDS
    // ==========================================================

    recognition.onend = () => {

      console.log(
        "Speech recognition ended"
      );

      setIsListening(false);
    };


    // ==========================================================
    // START
    // ==========================================================

    try {

      recognition.start();

    } catch (error) {

      console.error(
        "Unable to start speech recognition:",
        error
      );

      setIsListening(false);
    }
  };


  // ============================================================
  // EDIT TRANSCRIPT
  // ============================================================

  const editAnswer = () => {

    const correctedText =
      window.prompt(
        "Please review and correct what you said:",
        pendingTranscript
      );


    // User pressed Cancel
    if (correctedText === null) {
      return;
    }


    const cleanedText =
      correctedText.trim();


    // Empty answer
    if (!cleanedText) {

      alert(
        "Please enter an answer before confirming."
      );

      return;
    }


    // Update displayed answer
    setUserSaid(cleanedText);

    // Update answer waiting for confirmation
    setPendingTranscript(cleanedText);
  };


  // ============================================================
  // CONFIRM TRANSCRIPT
  // ============================================================

  const confirmAnswer = () => {

    if (
      !pendingTranscript ||
      pendingTranscript.trim() === ""
    ) {

      alert(
        "No answer is available to submit."
      );

      return;
    }


    const confirmedText =
      pendingTranscript.trim();


    console.log(
      "Confirmed patient answer:",
      confirmedText
    );


    // Send confirmed answer to backend
    handleUserAnswer(confirmedText);


    // Clear pending state
    setPendingTranscript("");
  };


  // ============================================================
  // SUBMIT CONFIRMED ANSWER TO BACKEND
  // ============================================================

  const handleUserAnswer = async (userText) => {

    if (
      !userText ||
      userText.trim() === ""
    ) {
      return;
    }


    setLoading(true);


    // ==========================================================
    // BUILD UPDATED CONVERSATION
    // ==========================================================

    const updatedHistory = [

      ...conversation,

      {
        role: 'ai',
        text: aiQuestion
      },

      {
        role: 'user',
        text: userText
      }

    ];


    // Update conversation UI
    setConversation(updatedHistory);


    try {

      // ========================================================
      // CALL BACKEND FOR INTERACTIVE STEP
      // ========================================================

      const res = await API.post(
        '/assessments/next-question',
        updatedHistory
      );


      console.log(
        "Backend response:",
        res.data
      );


      // ========================================================
      // CHECK COMPLETION
      // ========================================================

      const completedSignal =
        res.data?.isComplete ||
        res.data?.completed;


      // ========================================================
      // ASSESSMENT COMPLETED
      // ========================================================

      if (completedSignal) {

        setIsComplete(true);

        const finalMsg =
          res.data?.nextQuestion &&
          res.data.nextQuestion.trim() !== ""
            ? res.data.nextQuestion
            : "Thank you. Your medical assessment is now complete.";

        setAiQuestion(finalMsg);
        speakText(finalMsg);

        // ------------------------------------------------------
        // PHASE 2 PERSISTENCE: SAVE ASSESSMENT TO DATABASE
        // ------------------------------------------------------
        try {
          const firstUserEntry = updatedHistory.find(item => item.role === 'user');
          const chiefSymptoms = firstUserEntry ? firstUserEntry.text : "Not specified";
          const fullAnswersText = updatedHistory
            .filter(item => item.role === 'user')
            .map(item => item.text)
            .join(' | ');

          // Request clinical summary generation
          const summaryRes = await API.post('/assessments/summary', {
            symptoms: chiefSymptoms,
            answers: fullAnswersText
          });

          const summaryText = summaryRes.data?.summary || finalMsg;

          // Save final assessment to MySQL
          const saveRes = await API.post('/assessments', {
            symptoms: chiefSymptoms,
            answers: fullAnswersText,
            aiSummary: summaryText
          });

          if (saveRes.data?.id) {
            setAssessmentId(saveRes.data.id);
          }
        } catch (saveError) {
          console.error("Failed to save completed assessment:", saveError);
        }

      }

      // ========================================================
      // NEXT QUESTION
      // ========================================================

      else if (res.data?.nextQuestion || res.data?.question) {

        const nextQuestion = res.data.nextQuestion || res.data.question;

        setAiQuestion(nextQuestion);

        speakText(nextQuestion);
      }


    } catch (err) {

      console.error(
        'Error in interactive step:',
        err
      );


      const backendMessage =
        err.response?.data?.message ||
        err.response?.data ||
        err.message;


      alert(
        "Backend Error: " +
        backendMessage
      );


    } finally {

      setLoading(false);
    }
  };


  // ============================================================
  // DOWNLOAD PDF
  // ============================================================

  const handleDownloadPdf = async () => {

    if (!assessmentId) {

      alert(
        "No assessment record ID found for report download. Please ensure session was saved."
      );

      return;
    }


    try {

      const response = await API.get(
        `/pdf/export/${assessmentId}`,
        {
          responseType: 'blob',
        }
      );


      const blob = new Blob(
        [response.data],
        {
          type: 'application/pdf'
        }
      );


      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');

      link.href = downloadUrl;

      link.setAttribute(
        'download',
        `Clinical_Report_${assessmentId}.pdf`
      );

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {

      console.error(
        'Error downloading PDF report:',
        error
      );

      alert(
        'Failed to download PDF report. Please try again.'
      );
    }
  };


  // ============================================================
  // UI
  // ============================================================

  return (

    <div style={styles.container}>

      {/* ======================================================
          HEADER
      ======================================================= */}

      <h2 style={styles.header}>
        AI Voice Medical Intake
      </h2>


      {/* ======================================================
          AI QUESTION CARD
      ======================================================= */}

      <div
        style={{
          ...styles.questionCard,

          backgroundColor:
            isComplete
              ? '#f0fdf4'
              : '#eff6ff',

          borderColor:
            isComplete
              ? '#bbf7d0'
              : '#bfdbfe',
        }}
      >

        <p style={styles.cardLabel}>

          {isComplete
            ? 'Status:'
            : 'AI Question:'}

        </p>


        <h3
          style={{
            ...styles.cardQuestion,

            color:
              isComplete
                ? '#059669'
                : '#1d4ed8',
          }}
        >

          {aiQuestion}

        </h3>

      </div>


      {/* ======================================================
          VOICE CONTROLS
      ======================================================= */}

      {!isComplete ? (

        <div style={styles.controlsSection}>

          {/* ==================================================
              MICROPHONE BUTTON
          =================================================== */}

          <button

            onClick={startListening}

            disabled={
              isListening ||
              loading ||
              pendingTranscript
            }

            style={{
              ...styles.micButton,

              backgroundColor:
                isListening
                  ? '#dc2626'
                  : loading
                    ? '#9ca3af'
                    : pendingTranscript
                      ? '#9ca3af'
                      : '#059669',

              cursor:
                isListening ||
                loading ||
                pendingTranscript
                  ? 'not-allowed'
                  : 'pointer',
            }}
          >

            {isListening
              ? '🎙️ Listening...'
              : loading
                ? '⏳ Processing...'
                : pendingTranscript
                  ? '✓ Review Your Answer'
                  : '🎤 Click to Speak Answer'}

          </button>


          {/* ==================================================
              TRANSCRIPT REVIEW
          =================================================== */}

          {pendingTranscript && (

            <div style={styles.transcriptReview}>

              <p style={styles.userSaidText}>

                <strong>
                  You said:
                </strong>

                {" "}
                "{pendingTranscript}"

              </p>


              <p style={styles.reviewText}>

                Please check that the transcription
                is correct before continuing.

              </p>


              {/* ============================================
                  REVIEW BUTTONS
              ============================================= */}

              <div style={styles.reviewButtons}>

                <button

                  onClick={confirmAnswer}

                  disabled={loading}

                  style={styles.confirmButton}
                >

                  ✓ Confirm

                </button>


                <button

                  onClick={editAnswer}

                  disabled={loading}

                  style={styles.editButton}
                >

                  ✎ Edit

                </button>

              </div>

            </div>

          )}


          {/* ==================================================
              OLD USER SAID DISPLAY
          =================================================== */}

          {!pendingTranscript && userSaid && (

            <p style={styles.userSaidText}>

              <strong>
                You said:
              </strong>

              {" "}
              "{userSaid}"

            </p>

          )}

        </div>

      ) : (

        /* ====================================================
           COMPLETION & PDF DOWNLOAD
        ===================================================== */

        <div style={styles.completedCard}>

          <h3
            style={{
              color: '#059669',
              marginBottom: '8px'
            }}
          >

            ✓ Intake Completed

          </h3>


          <p
            style={{
              color: '#4b5563',
              marginBottom: '16px'
            }}
          >

            All intake questions have been answered.
            Your pre-assessment report is stored in your account history.
            You can now download the structured PDF clinical summary report.

          </p>


          <button

            onClick={handleDownloadPdf}

            style={styles.pdfButton}
          >

            📄 Download Medical PDF Report

          </button>

        </div>

      )}


      {/* ======================================================
          CONVERSATION HISTORY
      ======================================================= */}

      {conversation.length > 0 && (

        <div style={styles.historySection}>

          <h4 style={styles.historyHeader}>

            Conversation History:

          </h4>


          <div style={styles.historyBox}>

            {conversation.map(
              (entry, index) => (

                <div
                  key={index}
                  style={styles.historyItem}
                >

                  <strong
                    style={{
                      color:
                        entry.role === 'ai'
                          ? '#1d4ed8'
                          : '#1f2937'
                    }}
                  >

                    {entry.role === 'ai'
                      ? 'AI Assistant: '
                      : 'Patient: '}

                  </strong>


                  <span>
                    {entry.text}
                  </span>

                </div>

              )
            )}

          </div>

        </div>

      )}

    </div>
  );
}


// ============================================================
// STYLES
// ============================================================

const styles = {

  container: {
    maxWidth: '650px',
    margin: '30px auto',
    padding: '24px',
    fontFamily:
      'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
  },


  header: {
    textAlign: 'center',
    marginBottom: '24px',
    color: '#111827',
  },


  questionCard: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center',
    marginBottom: '24px',
  },


  cardLabel: {
    color: '#6b7280',
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },


  cardQuestion: {
    fontSize: '18px',
    margin: 0,
    lineHeight: '1.4',
  },


  controlsSection: {
    textAlign: 'center',
    marginBottom: '32px',
  },


  micButton: {
    color: '#ffffff',
    padding: '12px 28px',
    fontSize: '16px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '30px',
    transition:
      'background-color 0.2s ease',
  },


  // ==========================================================
  // TRANSCRIPT REVIEW
  // ==========================================================

  transcriptReview: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
  },


  userSaidText: {
    marginTop: '0',
    color: '#4b5563',
    fontStyle: 'italic',
    lineHeight: '1.5',
  },


  reviewText: {
    marginTop: '8px',
    color: '#6b7280',
    fontSize: '13px',
  },


  reviewButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '12px',
  },


  confirmButton: {
    backgroundColor: '#059669',
    color: '#ffffff',
    padding: '9px 18px',
    border: 'none',
    borderRadius: '7px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },


  editButton: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: '9px 18px',
    border: 'none',
    borderRadius: '7px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },


  // ==========================================================
  // COMPLETED CARD
  // ==========================================================

  completedCard: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center',
    marginBottom: '32px',
  },


  pdfButton: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },


  // ==========================================================
  // CONVERSATION HISTORY
  // ==========================================================

  historySection: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '20px',
  },


  historyHeader: {
    color: '#374151',
    marginBottom: '12px',
  },


  historyBox: {
    maxHeight: '260px',
    overflowY: 'auto',
    backgroundColor: '#f9fafb',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #f3f4f6',
  },


  historyItem: {
    marginBottom: '10px',
    lineHeight: '1.5',
    fontSize: '15px',
  },
};