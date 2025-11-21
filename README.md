# 🧾 AI-powered Invoice Generator (MERN Stack)

## 📘 Overview
This project aims to build an **AI-powered Invoice Generator** using the **MERN stack (MongoDB, Express.js, React, Node.js)**.
The system automates invoice creation and management, leveraging AI to extract key details, generate formatted invoices efficiently, and provide financial insights.

---

## 🚀 Tech Stack
- **Frontend:** React, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **AI/ML Integration:** Google Gemini API

---

## 📅 Development Progress

### **Week 1: Project Setup & Landing Page**
**Focus:** Initializing the frontend and building the public-facing UI.
- ✅ **Frontend Setup:** Configured React App & Tailwind CSS
- ✅ **Structure:** Defined project files, folders, and application routes.
- ✅ **Landing Page UI:**
  - **Header Component:** Responsive navigation.
  - **Hero Section:** Engaging introduction.
  - **Features Section:** Highlighting core capabilities.
  - **Testimonials & FAQ:** Social proof and information.
  - **Footer Component:** Links and contact info.

---

### **Week 2: Backend Architecture & API Development**
**Focus:** Setting up the server, database, and core business logic.
- ✅ **Server Initialization:** Backend setup and MongoDB connection.
- ✅ **Database Schemas:** Created Mongoose models for **Users** and **Invoices**.
- ✅ **Authentication:** Built Auth Middleware and APIs (Login, Signup, Get Profile).
- ✅ **Invoice APIs:** Developed CRUD endpoints (Create, Get All, Get by ID, Update, Delete).
- ✅ **AI Backend Logic:**
  - Built endpoints for **AI Invoice Creation** (Parse Text).
  - Built endpoints for **AI Reminder Emails**.
  - Built endpoints for **AI Dashboard Insights**.

---

### **Week 3: Client-Side Authentication & Dashboard Core**
**Focus:** Connecting frontend to backend and building the secure dashboard.
- ✅ **API Integration:** Defined API endpoints and configured Axios instance.
- ✅ **State Management:** Set up **Auth Context** for user session management.
- ✅ **Authentication UI:**
  - Created fully functional **Login Page**.
  - Created fully functional **Signup Page**.
  - Implemented secure **Dashboard Layout**.
- ✅ **Dashboard Features:**
  - Built the main **Dashboard Page** overview.
  - Implemented **Recent Invoices Section**.

---

### **Week 4: Advanced Features, AI UI & Final Polish**
**Focus:** Implementing complex forms, AI components, and finishing touches.
- ✅ **Smart Analytics:** Integrated **AI Insights Card** on the dashboard.
- ✅ **Invoice Management:**
  - Built **Create Invoice Page** with reusable form inputs.
  - Built **All Invoices Page** with filtering.
  - Implemented functions to **Delete** and **Update Status**.
- ✅ **AI Features UI:**
  - Built **"Create with AI" Component** (Text-to-Invoice).
  - Built **"Generate Reminder Email" Component**.
- ✅ **Final Details:**
  - Created **Invoice Detail Page**.
  - Implemented **Print & Download PDF** functionality.
  - Completed **Profile Info Page** for business details.

---

## 🛠️ Installation & Setup (for local development)

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/yourusername/ai-invoice-generator.git](https://github.com/yourusername/ai-invoice-generator.git)
    cd ai-invoice-generator
    ```

2.  **Set up Backend**
    ```bash
    # Navigate to the backend folder
    cd backend

    # Install backend dependencies
    npm install

    # Create your local environment file from the template
    cp .env.example .env 
    
    # Open the .env file and add your secret keys (DB_URI, JWT_SECRET, GEMINI_API_KEY, etc.)
    
    # Run the backend server
    npm run dev
    ```

3.  **Set up Frontend**
    (Open a **new terminal** and navigate back to the root `ai-invoice-generator` directory)
    ```bash
    # Navigate to the frontend folder
    cd frontend/invoice-generator 

    # Install frontend dependencies
    npm install

    # Run the frontend development server
    npm run dev
    ```

Your backend will now be running (usually on `http://localhost:8000`) and your frontend will be running (usually on `http://localhost:5173`).