import React, { useEffect, useState } from 'react';
import './App.css';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import { useSpeechSynthesis } from 'react-speech-kit';
import mammoth from 'mammoth';
const { speak, cancel } = useSpeechSynthesis();


pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
import 'bootstrap/dist/css/bootstrap.min.css';

export default function App() {
  const [fileData, setFileData] = useState(null);
  const [textItems, setTextItems] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [speechOn, setSpeechOn] = useState(true);
  const { speak, cancel } = useSpeechSynthesis();
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [flipTrigger, setFlipTrigger] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

//   const speak = (text) => {
//   window.speechSynthesis.cancel(); // cancel any ongoing speech
//   const utterance = new SpeechSynthesisUtterance(text);
//   window.speechSynthesis.speak(utterance);
// };


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
  
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      const reader = new FileReader();
      reader.onload = () => setFileData(reader.result);
      reader.readAsArrayBuffer(file);
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileType === 'application/msword' ||
      fileName.endsWith('.doc') ||
      fileName.endsWith('.docx')
    ) {
      alert('📄 Word document support is coming soon!');
    } else {
      alert('❌ Please choose a valid PDF or Word (.doc/.docx) file.');
    }
  };
  
  useEffect(() => {
    if (!fileData) return;

    const loadPDF = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({ data: fileData });
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
      } catch (err) {
        alert('Invalid PDF file. Please upload a proper PDF.');
        setPdfDoc(null);
      }
    };
    
    loadPDF();
  }, [fileData]);

  useEffect(() => {
    if (!pdfDoc || !currentPage) return;

    const loadPageText = async () => {
      const page = await pdfDoc.getPage(currentPage);
      const textContent = await page.getTextContent();
      const items = textContent.items;
const words = [];
let currentWord = '';
let lastX = null;

items.forEach((item, i) => {
  const str = item.str;
  const x = item.transform[4];

  if (lastX !== null && x - lastX > 1) { 
    if (currentWord) words.push(currentWord);
    currentWord = '';
  }

  currentWord += str;
  lastX = x + item.width;
});

if (currentWord) {
  words.push(currentWord);
}

setTextItems(words);
setFlipTrigger(false); 
setTimeout(() => setFlipTrigger(true), 0); 


    };

    loadPageText();
  }, [pdfDoc, currentPage]);

  const handleHover = (word, index) => {
    if (speechOn && hoveredIndex !== index) {
      cancel();
      speak({ text: word });
    }
    setHoveredIndex(index);
  };

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  return (
    <div className={`container py-5 ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            id="darkModeSwitch"
            checked={darkMode}
            onChange={() => setDarkMode(!darkMode)}
          />
          <label className="form-check-label ms-2" htmlFor="darkModeSwitch">
            {darkMode ? '🌙' : '☀️'}
          </label>
        </div>

        <div className="text-center mb-4">
        <h1 className="mb-3 ways-slide-in">Visualize Your Text</h1>
        <p className="lead">Hover over words to magnify and hear them read aloud.</p>
        <input 
         type="file" 
         accept=".pdf,.doc,.docx"
         onChange={handleFileChange} className="form-control w-auto d-inline-block mt-3" />
      </div>

        <button onClick={() => setSpeechOn(!speechOn)} className="btn btn-sm btn-secondary ">
          {speechOn ? '🔈' : '🔇'}
        </button>
      </div>


      {pdfDoc && (
        <>
          <div className="d-flex justify-content-center align-items-center mb-3">
            <button onClick={prevPage} disabled={currentPage === 1} className="btn btn-secondary pagenum me-2">
              ⬅ Prev
            </button>
            <span className="fw-bold">
              Page {currentPage} / {totalPages}
            </span>
            <button onClick={nextPage} disabled={currentPage === totalPages} className="btn btn-secondary pagenum ms-2">
              Next ➡
            </button>
          </div>

          <div className={`border rounded p-3  reader-text fade-in ${flipTrigger ? 'page-flip' : ''}`}>
          {textItems.map((word, i) => (
          <span
            key={i}
            onMouseEnter={() => handleHover(word, i)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`word ${hoveredIndex === i ? 'highlighted' : ''}`}
          >
          {word + ' '}
          </span>
          ))}

          </div>
        </>
      )}
    </div>
  );
}
