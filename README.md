
# LexLock RingGuard 🛡️

**AI-Powered Security Incident & Digital Evidence Management**

LexLock RingGuard is a security incident management prototype that connects Ring camera events with incident records and digital evidence verification. It helps organize security events, track investigations, maintain evidence hashes, and generate incident reports.

## 🚀 Key Features

- **Ring Camera Integration:** Connect to supported Ring devices and view the live stream.
- **Security Event Monitoring:** Receive and display Ring webhook events.
- **Incident Management:** Create incidents from security events, track status, and add investigation notes.
- **Evidence Vault:** Upload evidence files, calculate SHA-256 hashes, and verify whether stored files have changed.
- **Case Timeline:** Review incident creation and linked evidence activity.
- **Visitor Log:** Register visitors and record entry and exit times.
- **Incident Reports:** Download text-based reports containing incident details and evidence hashes.
- **Real-Time Event Updates:** Use Server-Sent Events (SSE) to deliver event updates to connected clients.

## 🧰 Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Node.js APIs
- Ring API integration
- SHA-256 file hashing
- Server-Sent Events (SSE)
- Local JSON and file-based storage for the prototype

## 📋 Prerequisites

- Node.js and npm
- A GitHub account
- Ring Developer credentials or an appropriate Ring access token for camera integration

## ⚙️ Local Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/heyysaqlain/lexlock-ringguard.git
   cd lexlock-ringguard
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env.local` file in the project root.

4. Configure the environment variables required by the existing Ring integration. Refer to the route implementation and configuration code for the exact variable names.

   **Never commit real tokens, passwords, or secrets.**

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

## 🧪 Testing the Prototype

### Simulate a security event

Use PowerShell:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/webhook/test?type=motion_detected" -Method POST
```

The test endpoint should return a simulated event response. Check the Ring Events dashboard and incident list.

### Verify an evidence file

1. Open the Evidence Vault.
2. Select an incident.
3. Upload a test file.
4. Record the displayed SHA-256 hash.
5. Use the Verify action to compare the stored file against its recorded hash.

### Download an incident report

Open the Incidents page, select an incident, and use **Download Report**.

## 🗂️ Main Application Routes

| Route | Purpose |
|---|---|
| `/` | Main dashboard and Ring events |
| `/visitors` | Visitor entry and exit tracking |
| `/evidence` | Evidence upload and integrity verification |
| `/incidents` | Incident details, case timeline, and report download |
| `/api/webhook` | Ring webhook and SSE endpoint |
| `/api/webhook/test` | Simulated webhook events |
| `/api/incidents` | Incident records API |
| `/api/visitors` | Visitor records API |
| `/api/evidence` | Evidence upload and listing API |

## 🔐 Security & Data Integrity

- Environment files and credentials must remain private.
- Evidence files are hashed with SHA-256 for integrity comparison.
- Access to Ring devices depends on valid credentials and token status.
- Do not upload private evidence or real incident records to a public repository.

**Important:** A matching SHA-256 hash only indicates that the file matches the stored digest. It does not independently prove the original source, authenticity, chain of custody, or legal admissibility.

## ⚠️ Current Prototype Limitations

- Local JSON and filesystem storage are intended for development and demonstration, not concurrent production use.
- In-memory event storage may reset when the server restarts.
- Ring device discovery requires valid, non-expired credentials.
- Simulated webhook events are for demonstration and must not be presented as real camera detections.
- Production deployment requires persistent database and file storage, appropriate authentication, authorization, and operational security controls.

## 🛣️ Future Improvements

- Persistent database for incidents and visitor records.
- Durable event processing and duplicate-event prevention.
- Secure cloud evidence storage and access controls.
- PDF incident report generation.
- Role-based access for security teams and investigators.
- Deployment monitoring and automated testing.

## 👨‍💻 Repository

GitHub: https://github.com/heyysaqlain/lexlock-ringguard

---

**LexLock RingGuard**  
*Capture. Verify. Protect.*
