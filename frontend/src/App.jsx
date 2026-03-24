import { useState, useEffect, useRef } from "react";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom whenever messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    
    const textToSend = input;
    setInput("");
    setLoading(true);

    try {
      // Direct call to your FastAPI server
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { role: "model", text: data.reply }
      ]);
    } catch (err) {
      console.error("Fetch error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "❌ Error: Could not reach the AI. Is the backend running?" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "20px auto", padding: "20px", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center", color: "#333" }}>AI Chat Companion</h1>
      
      <div style={{
        background: "#1e1e1e", color: "white", height: "500px",
        borderRadius: "12px", padding: "20px", overflowY: "auto",
        display: "flex", flexDirection: "column", gap: "10px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.3)"
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            background: msg.role === "user" ? "#007bff" : "#444",
            padding: "10px 15px", borderRadius: "15px", maxWidth: "70%"
          }}>
            {msg.text}
          </div>
        ))}
        {loading && <div style={{ color: "#007bff" }}>AI is thinking...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: "flex", marginTop: "15px", gap: "10px" }}>
        <input
          style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask me anything..."
          disabled={loading}
        />
        <button 
          onClick={sendMessage} 
          disabled={loading}
          style={{ 
            padding: "10px 20px", borderRadius: "8px", border: "none", 
            backgroundColor: "#007bff", color: "white", cursor: "pointer" 
          }}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default App;