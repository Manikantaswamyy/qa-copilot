require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const multer = require("multer");
const fs = require("fs");
const mammoth = require("mammoth");
const ExcelJS = require("exceljs");

const app = express();

app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = "uploads";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  dest: "uploads/",
});

let portalKnowledge = "";

if (!process.env.OPENROUTER_API_KEY) {
  console.warn("WARNING: OPENROUTER_API_KEY not set in environment");
}

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

app.get("/", (req, res) => {
  res.send("QA Copilot Backend Running 🚀");
});

/*

# UPLOAD FILE

*/

app.post("/upload", upload.single("file"), async (req, res) => {
try {
if (!req.file) {
return res.status(400).json({
error: "No file uploaded",
});
}

let extractedText = "";
const filePath = req.file.path;

console.log("\n========================");
console.log("FILE RECEIVED");
console.log("========================");
console.log("Original Name:", req.file.originalname);
console.log("Stored Path:", filePath);

if (
  req.file.originalname
    .toLowerCase()
    .endsWith(".docx")
) {
  console.log("DOCX DETECTED");

  const docResult =
    await mammoth.extractRawText({
      path: filePath,
    });

  extractedText =
    docResult.value || "";

  console.log(
    "Extracted Characters:",
    extractedText.length
  );

  console.log(
    "First 300 Characters:"
  );

  console.log(
    extractedText.substring(0, 300)
  );
} else {
  console.log(
    "NOT DOCX - Using text read"
  );

  try {
    extractedText =
      fs.readFileSync(
        filePath,
        "utf8"
      );
  } catch (err) {
    console.log(
      "Could not read file as text"
    );

    extractedText = "";
  }
}


portalKnowledge += `

FILE:
${req.file.originalname}

CONTENT:
${extractedText}

========================================================

`;


res.json({
  success: true,
  file: req.file.originalname,
  characters: extractedText.length,
  portalKnowledgeLength:
    portalKnowledge.length,
});

// remove uploaded file to save space
try {
  fs.unlinkSync(filePath);
} catch (e) {
  console.warn("Could not delete uploaded file:", filePath);
}

} catch (error) {
console.error(error);

res.status(500).json({
  error: "Upload failed",
});

}
});
/*
==================================
GENERATE EXCEL TEST CASES
==================================
*/

app.post("/generate", async (req, res) => {
  try {
    const { requirement } = req.body;

    const trimmedKnowledge =
  portalKnowledge.slice(0, 15000);
  console.time("AI Generation");
    const completion =
      await client.chat.completions.create({
        model: "deepseek/deepseek-r1-0528",

        messages: [
          {
            role: "system",
            content: `
You are a Senior QA Architect.

Use uploaded portal knowledge as PRIMARY source.

Generate ONLY valid JSON.

{
  "testCases": [
    {
      "tcId": "TC-001",
      "module": "",
      "scenario": "",
      "testCase": ""
    }
  ]
}

Rules:-

Generate COMPREHENSIVE enterprise QA coverage.

Analyze uploaded documents and identify:

- Modules
- Fields
- Workflows
- Roles
- Business Rules
- Validations
- Acceptance Criteria
- Security Requirements
- Performance Requirements

Do NOT invent functionality.

Generate exhaustive QA coverage.

The number of test cases should depend entirely on the complexity of the uploaded portal knowledge.

Generate every meaningful:
- Functional Scenario
- Negative Scenario
- Boundary Scenario
- Validation Scenario
- Security Scenario
- Role Based Scenario
- Performance Scenario
- Regression Scenario
- Integration Scenario
- Error Handling Scenario

Generate concise test cases.

Keep each test case under 20 words.

Do not explain.

Do not repeat scenarios.

Return compact JSON only.

No markdown.

No code blocks.

Return ONLY valid JSON.

            `,
          },

          {
            role: "user",
            content: `
PORTAL KNOWLEDGE:

${trimmedKnowledge}

REQUIREMENT:

${requirement}
            `,
          },
        ],

        response_format: {
          type: "json_object",
        },
      });

    const aiResponse =
  completion.choices[0].message.content;

console.log("AI RESPONSE:");
console.log(aiResponse);

const cleanedResponse =
  aiResponse
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

const parsedResponse =
  JSON.parse(cleanedResponse);

    const workbook =
      new ExcelJS.Workbook();

    const worksheet =
      workbook.addWorksheet(
        "Generated Test Cases"
      );

   worksheet.columns = [
  { header: "TC ID", key: "tcId", width: 15 },
  { header: "Module", key: "module", width: 25 },
  { header: "Scenario", key: "scenario", width: 35 },
  { header: "Test Case", key: "testCase", width: 60 },
  { header: "Status", key: "status", width: 18 },
  { header: "Reseller Status", key: "resellerStatus", width: 20 },
  { header: "QA Assignee", key: "qaAssignee", width: 20 },
  { header: "Comments", key: "comments", width: 30 },
];
    (parsedResponse.testCases || []).forEach(
  (tc) => {
    worksheet.addRow({
      tcId: tc.tcId || "",
      module: tc.module || "",
      scenario: tc.scenario || "",
      testCase: tc.testCase || "",
      status: "",
      resellerStatus: "",
      qaAssignee: "",
      comments: "",
    });
  }
);

    res.setHeader(
  "Content-Type",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
);

res.setHeader(
  "Content-Disposition",
  'attachment; filename="Generated_Test_Cases.xlsx"'
);

await workbook.xlsx.write(res);

res.end();

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error:
        "Failed to generate test cases",
    });
  }
});

/*
==================================
DEBUG KNOWLEDGE
==================================
*/

app.get("/knowledge", (req, res) => {
  res.json({
    knowledge: portalKnowledge,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});