'use client';
import { jsPDF } from 'jspdf';
// @ts-ignore
// import '../src/fonts/NotoSans-normal.js';
import { useState, useRef } from "react";
import { FiYoutube, FiSend, FiLoader, FiMessageSquare, FiInfo, FiFileText, FiUpload, FiGlobe, FiSave } from "react-icons/fi";
// import { jsPDF } from "jspdf";

// Define major languages
const LANGUAGES = {
  "English": "en",
  "Hindi": "hi",
  "Spanish": "es",
  "French": "fr",
  "German": "de",
  "Chinese": "zh",
  "Japanese": "ja",
  "Korean": "ko",
  "Russian": "ru",
  "Arabic": "ar",
  "Portuguese": "pt",
  "Italian": "it",
  "Dutch": "nl",
  "Turkish": "tr",
  "Vietnamese": "vi",
  "Thai": "th",
  "Indonesian": "id"
} as const;

export default function Home() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [translatedTranscript, setTranslatedTranscript] = useState("");
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState<{ role: string; content: string }[]>([]);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("Hindi");
  const [documentText, setDocumentText] = useState("");
  const [activeTab, setActiveTab] = useState<"youtube" | "document" | "pdf">("youtube");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError("");
    } else if (file) {
      setError("Please select a PDF file");
      setSelectedFile(null);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setLoadingTranscript(true);
    setError("");
    setTranscript("");
    setChat([]);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('language', language);

      const res = await fetch("/api/pdf", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      // Directly set the extracted text as transcript without analysis
      setTranscript(data.text);
    } catch (err: any) {
      setError(err.message || "Failed to process PDF");
    } finally {
      setLoadingTranscript(false);
    }
  };

  const fetchTranscript = async () => {
    setLoadingTranscript(true);
    setError("");
    setTranscript("");
    setTranslatedTranscript("");
    setChat([]);
    try {
      const res = await fetch("/api/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: youtubeUrl, language }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTranscript(data.transcript.map((t: any) => t.text).join(" "));
    } catch (err: any) {
      setError(err.message || "Failed to fetch transcript");
    } finally {
      setLoadingTranscript(false);
    }
  };

  const translateTranscript = async () => {
    if (!transcript) return;
    setLoadingTranslation(true);
    setError("");
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript, targetLanguage }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTranslatedTranscript(data.translation);
    } catch (err: any) {
      setError(err.message || "Failed to translate");
    } finally {
      setLoadingTranslation(false);
    }
  };

  const analyzeDocument = async () => {
    if (!documentText.trim()) return;
    setLoadingTranscript(true);
    setError("");
    setTranscript("");
    setChat([]);
    try {
      // Directly set the input text as transcript without analysis
      setTranscript(documentText);
    } catch (err: any) {
      setError(err.message || "Failed to process text");
    } finally {
      setLoadingTranscript(false);
    }
  };

  const askQuestion = async () => {
    if (!question.trim()) return;
    setLoadingAnswer(true);
    setError("");
    setChat((prev) => [...prev, { role: "user", content: question }]);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, transcript }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setChat((prev) => [...prev, { role: "assistant", content: data.answer }]);
      setQuestion("");
    } catch (err: any) {
      setError(err.message || "Failed to get answer");
    } finally {
      setLoadingAnswer(false);
    }
  };

  const saveToPDF = () => {
    const doc = new jsPDF();
    let yOffset = 20;
    const lineHeight = 7;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();

    // Add title
    doc.setFontSize(20);
    doc.text("AI Chat - Conversation History", margin, yOffset);
    yOffset += lineHeight * 2;

    // Add timestamp
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, yOffset);
    yOffset += lineHeight * 2;

    // Add chat history only
    if (chat.length > 0) {
      doc.setFontSize(16);
      doc.text("Chat History", margin, yOffset);
      yOffset += lineHeight;

      doc.setFontSize(12);
      chat.forEach((msg) => {
        // Check if we need a new page
        if (yOffset > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          yOffset = margin;
        }
        const role = msg.role === "user" ? "You" : "AI Assistant";
        doc.text(`${role}:`, margin, yOffset);
        yOffset += lineHeight;
        const messageLines = doc.splitTextToSize(msg.content, pageWidth - (margin * 2));
        doc.text(messageLines, margin, yOffset);
        yOffset += lineHeight * messageLines.length + lineHeight;
      });
    } else {
      doc.setFontSize(12);
      doc.text("No chat history available.", margin, yOffset);
    }

    // Save the PDF
    doc.save("ai-chat-history.pdf");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tr from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <div className="max-w-6xl mx-auto relative min-h-screen flex flex-col">
        {/* Header */}
        <header className="py-6 px-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg">
                <FiMessageSquare className="text-2xl" />
              </div>
              <h1 className="text-2xl font-bold gradient-text">AI Chat & Analysis</h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <FiInfo className="text-lg" />
                <span className="text-sm">How it works</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 flex flex-col gap-6">
          {/* Tab Navigation */}
          <div className="flex gap-4 max-w-3xl mx-auto w-full">
            <button
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                activeTab === "youtube"
                  ? "gradient-button"
                  : "bg-white/5 hover:bg-white/10"
              }`}
              onClick={() => setActiveTab("youtube")}
            >
              <div className="flex items-center justify-center gap-2">
                <FiYoutube />
                <span>YouTube Video</span>
              </div>
            </button>
            <button
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                activeTab === "document"
                  ? "gradient-button"
                  : "bg-white/5 hover:bg-white/10"
              }`}
              onClick={() => setActiveTab("document")}
            >
              <div className="flex items-center justify-center gap-2">
                <FiFileText />
                <span>Text</span>
              </div>
            </button>
            <button
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                activeTab === "pdf"
                  ? "gradient-button"
                  : "bg-white/5 hover:bg-white/10"
              }`}
              onClick={() => setActiveTab("pdf")}
            >
              <div className="flex items-center justify-center gap-2">
                <FiUpload />
                <span>PDF File</span>
              </div>
            </button>
          </div>

          {/* Input Section */}
          <div className="glass-card rounded-2xl p-6 max-w-3xl mx-auto w-full">
            {activeTab === "youtube" ? (
              <div className="flex gap-4">
                <div className="flex-1 relative group">
                  <FiYoutube className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-400 transition-colors" />
                  <input
                    type="text"
                    className="input-field w-full pl-12"
                    placeholder="Paste YouTube video URL here..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    disabled={loadingTranscript}
                  />
                </div>
                <select
                  className="input-field w-32 appearance-none bg-opacity-10 text-white"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={loadingTranscript}
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                >
                  {Object.entries(LANGUAGES).map(([name, code]) => (
                    <option key={code} value={code} className="bg-gray-800 text-white">
                      {name}
                    </option>
                  ))}
                </select>
                <button
                  className="gradient-button px-8 py-4 rounded-xl font-medium flex items-center gap-2"
                  onClick={fetchTranscript}
                  disabled={loadingTranscript || !youtubeUrl.trim()}
                >
                  {loadingTranscript ? (
                    <>
                      <FiLoader className="animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    "Analyze Video"
                  )}
                </button>
              </div>
            ) : activeTab === "document" ? (
              <div className="flex flex-col gap-4">
                <textarea
                  className="input-field min-h-[200px] resize-none"
                  placeholder="Paste your text here..."
                  value={documentText}
                  onChange={(e) => setDocumentText(e.target.value)}
                  disabled={loadingTranscript}
                />
                <div className="flex gap-4">
                  <select
                    className="input-field w-32 appearance-none bg-opacity-10 text-white"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    disabled={loadingTranscript}
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    {Object.entries(LANGUAGES).map(([name, code]) => (
                      <option key={code} value={code} className="bg-gray-800 text-white">
                        {name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="gradient-button flex-1 px-8 py-4 rounded-xl font-medium flex items-center justify-center gap-2"
                    onClick={analyzeDocument}
                    disabled={loadingTranscript || !documentText.trim()}
                  >
                    {loadingTranscript ? (
                      <>
                        <FiLoader className="animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      "Analyze Text"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="pdf-upload"
                    className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 border-white/20"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FiUpload className="w-12 h-12 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-400">PDF files only</p>
                    </div>
                    <input
                      id="pdf-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      ref={fileInputRef}
                    />
                  </label>
                </div>
                {selectedFile && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <FiFileText />
                    <span>{selectedFile.name}</span>
                  </div>
                )}
                <div className="flex gap-4">
                  <select
                    className="input-field w-32 appearance-none bg-opacity-10 text-white"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    disabled={loadingTranscript}
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    {Object.entries(LANGUAGES).map(([name, code]) => (
                      <option key={code} value={code} className="bg-gray-800 text-white">
                        {name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="gradient-button flex-1 px-8 py-4 rounded-xl font-medium flex items-center justify-center gap-2"
                    onClick={handleFileUpload}
                    disabled={loadingTranscript || !selectedFile}
                  >
                    {loadingTranscript ? (
                      <>
                        <FiLoader className="animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      "Analyze PDF"
                    )}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 backdrop-blur-sm">
                {error}
              </div>
            )}

            {transcript && (
              <div className="mt-4 space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="font-medium">
                        {activeTab === "youtube" ? "Video transcript" : activeTab === "document" ? "Text" : "PDF"} loaded successfully
                      </span>
                    </div>
                    <button
                      className="gradient-button px-6 py-2 rounded-xl font-medium flex items-center gap-2"
                      onClick={saveToPDF}
                    >
                      <FiSave />
                      <span>Save Report</span>
                    </button>
                  </div>
                </div>

                {activeTab === "youtube" && (
                  <>
                    {/* Action Buttons */}
                    <div className="flex gap-4">
                      <button
                        className="gradient-button flex-1 px-6 py-4 rounded-xl font-medium flex items-center justify-center gap-2"
                        onClick={() => setShowTranscript(!showTranscript)}
                      >
                        <FiFileText />
                        <span>{showTranscript ? "Hide Transcript" : "Show Transcript"}</span>
                      </button>
                      <button
                        className="gradient-button flex-1 px-6 py-4 rounded-xl font-medium flex items-center justify-center gap-2"
                        onClick={() => setShowTranslation(!showTranslation)}
                      >
                        <FiGlobe />
                        <span>{showTranslation ? "Hide Translation" : "Show Translation"}</span>
                      </button>
                    </div>

                    {/* Translation Section */}
                    {showTranslation && (
                      <div className="space-y-4">
                        <div className="flex gap-4 items-center">
                          <select
                            className="input-field flex-1 appearance-none bg-opacity-10 text-white"
                            value={targetLanguage}
                            onChange={(e) => setTargetLanguage(e.target.value)}
                            disabled={loadingTranslation}
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                          >
                            {Object.keys(LANGUAGES).map((lang) => (
                              <option key={lang} value={lang} className="bg-gray-800 text-white">
                                Translate to {lang}
                              </option>
                            ))}
                          </select>
                          <button
                            className="gradient-button px-6 py-4 rounded-xl font-medium flex items-center gap-2"
                            onClick={translateTranscript}
                            disabled={loadingTranslation}
                          >
                            {loadingTranslation ? (
                              <>
                                <FiLoader className="animate-spin" />
                                <span>Translating...</span>
                              </>
                            ) : (
                              <>
                                <FiGlobe />
                                <span>Translate</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Display translated text if available */}
                        {translatedTranscript && (
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 backdrop-blur-sm">
                            <div className="flex items-center gap-3 text-blue-400 mb-2">
                              <FiGlobe className="text-lg" />
                              <span className="font-medium">Translated to {targetLanguage}:</span>
                            </div>
                            <p className="text-white/90 whitespace-pre-wrap">{translatedTranscript}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Original transcript */}
                    {showTranscript && (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                        <div className="flex items-center gap-3 text-gray-400 mb-2">
                          <FiFileText className="text-lg" />
                          <span className="font-medium">Original Transcript:</span>
                        </div>
                        <p className="text-white/90 whitespace-pre-wrap">{transcript}</p>
                      </div>
                    )}
                  </>
                )}

                {activeTab === "document" && (
                  <>
                    {/* Action Buttons */}
                    <div className="flex gap-4">
                      <button
                        className="gradient-button flex-1 px-6 py-4 rounded-xl font-medium flex items-center justify-center gap-2"
                        onClick={() => setShowTranslation(!showTranslation)}
                      >
                        <FiGlobe />
                        <span>{showTranslation ? "Hide Translation" : "Show Translation"}</span>
                      </button>
                    </div>

                    {/* Translation Section */}
                    {showTranslation && (
                      <div className="space-y-4">
                        <div className="flex gap-4 items-center">
                          <select
                            className="input-field flex-1 appearance-none bg-opacity-10 text-white"
                            value={targetLanguage}
                            onChange={(e) => setTargetLanguage(e.target.value)}
                            disabled={loadingTranslation}
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                          >
                            {Object.keys(LANGUAGES).map((lang) => (
                              <option key={lang} value={lang} className="bg-gray-800 text-white">
                                Translate to {lang}
                              </option>
                            ))}
                          </select>
                          <button
                            className="gradient-button px-6 py-4 rounded-xl font-medium flex items-center gap-2"
                            onClick={translateTranscript}
                            disabled={loadingTranslation}
                          >
                            {loadingTranslation ? (
                              <>
                                <FiLoader className="animate-spin" />
                                <span>Translating...</span>
                              </>
                            ) : (
                              <>
                                <FiGlobe />
                                <span>Translate</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Display translated text if available */}
                        {translatedTranscript && (
                          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <p className="text-white/90 whitespace-pre-wrap">{translatedTranscript}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {activeTab === "pdf" && (
                  <>
                    {/* Action Buttons */}
                    <div className="flex gap-4">
                      <button
                        className="gradient-button flex-1 px-6 py-4 rounded-xl font-medium flex items-center justify-center gap-2"
                        onClick={() => setShowTranslation(!showTranslation)}
                      >
                        <FiGlobe />
                        <span>{showTranslation ? "Hide Translation" : "Show Translation"}</span>
                      </button>
                    </div>

                    {/* Translation Section */}
                    {showTranslation && (
                      <div className="space-y-4">
                        <div className="flex gap-4 items-center">
                          <select
                            className="input-field flex-1 appearance-none bg-opacity-10 text-white"
                            value={targetLanguage}
                            onChange={(e) => setTargetLanguage(e.target.value)}
                            disabled={loadingTranslation}
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                          >
                            {Object.keys(LANGUAGES).map((lang) => (
                              <option key={lang} value={lang} className="bg-gray-800 text-white">
                                Translate to {lang}
                              </option>
                            ))}
                          </select>
                          <button
                            className="gradient-button px-6 py-4 rounded-xl font-medium flex items-center gap-2"
                            onClick={translateTranscript}
                            disabled={loadingTranslation}
                          >
                            {loadingTranslation ? (
                              <>
                                <FiLoader className="animate-spin" />
                                <span>Translating...</span>
                              </>
                            ) : (
                              <>
                                <FiGlobe />
                                <span>Translate</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Display translated text if available */}
                        {translatedTranscript && (
                          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <p className="text-white/90 whitespace-pre-wrap">{translatedTranscript}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Chat Section */}
          <div className="flex-1 glass-card rounded-2xl p-6 max-w-3xl mx-auto w-full flex flex-col">
            <div className="flex-1 overflow-y-auto rounded-xl bg-white/5 p-6 border border-white/10 backdrop-blur-sm mb-6">
              {chat.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <div className="text-center max-w-md">
                    <div className="inline-block p-4 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 mb-4 animate-float">
                      {activeTab === "youtube" ? <FiYoutube className="text-4xl" /> : activeTab === "document" ? <FiFileText className="text-4xl" /> : <FiUpload className="text-4xl" />}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Welcome to AI Chat & Analysis</h3>
                    <p className="text-gray-400">
                      {activeTab === "youtube"
                        ? "Paste a YouTube video URL above and start asking questions about its content!"
                        : activeTab === "document"
                        ? "Paste your text above and start asking questions about its content!"
                        : "Upload a PDF file above and start asking questions about its content!"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {chat.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} message-enter`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-5 ${
                          msg.role === "user"
                            ? "gradient-button"
                            : "glass-card"
                        }`}
                      >
                        <div className="font-medium mb-2 flex items-center gap-2">
                          {msg.role === "user" ? (
                            <>
                              <span className="w-2 h-2 bg-white rounded-full" />
                              You
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 bg-blue-400 rounded-full" />
                              AI Assistant
                            </>
                          )}
                        </div>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Question Input */}
            <div className="flex gap-4">
              <input
                type="text"
                className="input-field flex-1"
                placeholder="Ask a question about the content..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    askQuestion();
                  }
                }}
                disabled={loadingAnswer}
              />
              <button
                className="gradient-button px-8 py-4 rounded-xl font-medium flex items-center gap-2"
                onClick={askQuestion}
                disabled={loadingAnswer || !question.trim()}
              >
                {loadingAnswer ? (
                  <>
                    <FiLoader className="animate-spin" />
                    <span>Thinking...</span>
                  </>
                ) : (
                  <>
                    <FiSend />
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-4 px-4 border-t border-white/10 text-center text-sm text-gray-400">
          Powered by Gemini AI • Built with Next.js
        </footer>
      </div>
    </div>
  );
} 