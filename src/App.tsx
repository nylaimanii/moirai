function App() {
  return (
    <div style={{ minHeight: "100vh", background: "#040810", color: "#eaf6ff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.02em", color: "#5fe3c0" }}>
        moirai
      </h1>
      <p style={{ fontSize: 14, color: "#7fa8bd", marginTop: 8, letterSpacing: "0.04em" }}>
        run compute when it's clean and cheap
      </p>
      <p style={{ fontSize: 11, color: "#4a7a93", marginTop: 24, fontFamily: "monospace" }}>
        rebuild in progress
      </p>
    </div>
  );
}

export default App;
