# Jobbify ⚡ — Apply Smarter, Not Harder

<div align="center">
  <p>Jobbify is an AI-powered, browser-based web application designed to help job seekers instantly tailor their resumes, craft personalized LinkedIn DMs, and write effective cold emails for specific job applications.</p>
</div>

## 🌟 Features

- **Resume Parsing**: Seamlessly extract text from PDF and Word documents directly in the browser using `pdf.js` and `mammoth.js`, or paste your resume text manually.
- **Job Tailoring**: Supports analyzing your resume against multiple job descriptions (from LinkedIn, Indeed, etc.) simultaneously.
- **AI-Powered Analysis**: Uses **Groq API** (Llama 3, Mixtral) to provide:
  - Match percentage score.
  - Identification of key missing skills and ATS keywords.
  - Tailored bullet points for the resume.
  - A highly personalized, ready-to-send LinkedIn DM.
  - A comprehensive cold email draft.
- **Privacy First**: Fully client-side! Your resume, job descriptions, and data do not get stored on any remote database. The app makes direct requests to the Groq API from your browser.
- **Hinglish/Localized UI**: The interface uses a friendly Hinglish tone tailored for Indian job seekers.

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla JavaScript, CSS3
- **Document Parsers**: [Mammoth.js](https://github.com/mwilliamson/mammoth.js/) (for `.docx`), [PDF.js](https://mozilla.github.io/pdf.js/) (for `.pdf`)
- **AI Provider**: [Groq API](https://groq.com/) (OpenAI-compatible endpoints running Llama 3 / Mixtral models)

## 🚀 Getting Started

Since Jobbify relies entirely on front-end technologies, you don't need a backend server. You can run it effortlessly on your local machine.

### Prerequisites

- A web browser (Google Chrome, Firefox, Edge, etc.)
- A **Groq API Key**. You can get a free API key at [Groq Console](https://console.groq.com/keys).

### Installation

1. **Clone the repository** (or download the ZIP file):
   ```bash
   git clone https://github.com/your-username/Jobbify.git
   cd Jobbify
   ```

2. **Configure your API Key**:
   - Copy the example configuration file:
     ```bash
     cp config.example.js config.js
     ```
   - Open `config.js` and replace `'your_groq_api_key_here'` with your actual Groq API key:
     ```javascript
     const CONFIG = {
       GROQ_API_KEY: 'gsk_your_actual_api_key_here...'
     };
     ```
   - *Note: `config.js` is included in `.gitignore` to prevent leaking your private API key to version control.*

3. **Run the Application**:
   - Simply double-click `index.html` to open it in your browser.
   - Or, if you use VS Code, use an extension like **Live Server** to serve the directory locally.

## 💡 How to Use

1. **Step 1: Resume Upload**  
   Upload your current resume (PDF, DOCX, TXT) or directly paste the text contents into the application. Fill in your basic details (Name, Target Role, Experience).
2. **Step 2: Add Jobs**  
   Copy and paste entire Job Descriptions (JDs) from LinkedIn, Indeed, or any career page. You can add as many jobs as you like in a single session.
3. **Step 3: Analyze**  
   Hit the "Analyse" button. The application will leverage Groq's high-speed inference to cross-reference your resume against the provided JDs.
4. **Step 4: View Results**  
   For each job, Jobbify provides an individual result card with:
   - **Fit Analysis**: Highlighting missing skills and ATS keywords.
   - **Resume Content**: Tailored summary and bullet points to update your base resume.
   - **LinkedIn DM**: A short, professional message designed for hiring managers on LinkedIn.
   - **Cold Email**: A persuasive, well-structured cold email draft.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page. 

## 📝 License

This project is open-source and available under the MIT License.
