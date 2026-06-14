import { useState } from "react";
import "./App.css";

function App() {
  const [requirement, setRequirement] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);

  const [uploadedFiles, setUploadedFiles] = useState([]);

  const uploadFile = async () => {
    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }

    const formData = new FormData();

    formData.append("file", selectedFile);

    try {
      const response = await fetch(
        "https://qa-copilot-backend-65w4.onrender.com/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      setUploadedFiles((prev) => [
        ...prev,
        data.file,
      ]);

      alert("File uploaded successfully");

    } catch (error) {
      console.error(error);

      alert("Upload failed");
    }
  };

  const generateTestCases = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "https://qa-copilot-backend-65w4.onrender.com/generate",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            requirement,
          }),
        }
      );

      const blob =
        await response.blob();

      const url =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        "Generated_Test_Cases.xlsx";

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(
        url
      );

      alert(
        "Excel downloaded successfully"
      );

    } catch (error) {
      console.error(error);

      alert(
        "Failed to generate Excel"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">

      <div className="navbar">

        <div className="logo-section">
          🤖 Portal-Aware QA Copilot
        </div>

        <div className="user-section">
          DeepSeek Powered
        </div>

      </div>

      <div className="hero">

        <h1>
          Let's Generate Amazing
          Test Cases
        </h1>

        <p>
          Upload your documents,
          provide requirements and
          let AI generate enterprise
          grade test cases.
        </p>

      </div>

      <div className="stats">

        <div className="stat-card">
          <h3>
            {uploadedFiles.length}
          </h3>

          <p>
            Documents Uploaded
          </p>
        </div>

        <div className="stat-card">
          <h3>
            {requirement.length}
          </h3>

          <p>
            Requirement Characters
          </p>
        </div>

        <div className="stat-card">
          <h3>AI</h3>

          <p>
            DeepSeek Powered
          </p>
        </div>

      </div>

      <div className="main-grid">

        <div className="knowledge-panel">

          <h2>
            Knowledge Sources
          </h2>

          <div className="upload-box">

            <input
              type="file"
              onChange={(e) =>
                setSelectedFile(
                  e.target.files[0]
                )
              }
            />

            <button
              onClick={uploadFile}
            >
              Upload Document
            </button>

          </div>

          <div className="file-list">

            {uploadedFiles.length >
            0 ? (

              uploadedFiles.map(
                (file, index) => (
                  <div
                    key={index}
                    className="file-item"
                  >
                    📄 {file}
                  </div>
                )
              )

            ) : (

              <p>
                No documents uploaded
              </p>

            )}

          </div>

        </div>

        <div className="requirement-panel">

          <h2>
            Requirement Input
          </h2>

          <textarea
            placeholder="Paste your requirement or user story here..."
            value={requirement}
            rows={8}
            onChange={(e) => {
              setRequirement(
                e.target.value
              );

              e.target.style.height =
                "auto";

              e.target.style.height =
                e.target.scrollHeight +
                "px";
            }}
          />

          <button
            className="generate-btn"
            onClick={
              generateTestCases
            }
          >
            {loading
              ? "Generating Excel..."
              : "Generate & Download Excel"}
          </button>

        </div>

      </div>

    </div>
  );
}

export default App;