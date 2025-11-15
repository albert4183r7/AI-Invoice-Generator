# 🧾 AI-powered Invoice Generator (MERN Stack)

## 📘 Overview
This project aims to build an **AI-powered Invoice Generator** using the **MERN stack (MongoDB, Express.js, React, Node.js)**.
The system will automate invoice creation and management, leveraging AI to extract key details and generate formatted invoices efficiently.

---

## 🚀 Tech Stack
- **Frontend:** React, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **AI/ML Integration:** (to be added)

---

## 📅 Development Progress

### **Week 1**
#### Frontend
- ✅ Header component implemented
  - Added navigation structure and styling.
  - Integrated responsive design using Tailwind CSS.

---

### **Week 2**
#### Frontend
- ✅ Landing Page completed
  - Added **Hero section** introducing the product.
  - Implemented **Features section** showcasing key functionalities.
  - Added **Testimonials section** for user feedback display.
  - Included **FAQ section** for common questions.
  - Designed and built **Footer** with contact and social links.

---

### **Week 3**
#### Backend
- ✅ Initialized Node.js/Express backend with project structure.
- ✅ Established connection to MongoDB database.
- ✅ Created database schemas for **User** and **Invoice** models.
- ✅ Built secure authentication APIs (register, login) using **JWT**.
- ✅ Implemented authentication middleware for protecting routes.
- ✅ Developed core **CRUD APIs** for invoice management.
- ✅ Defined initial API endpoints for future AI integration.

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
    
    # Open the .env file and add your secret keys (DB_URI, JWT_SECRET, etc.)
    
    # Run the backend server
    npm start 
    ```

3.  **Set up Frontend**
    (Open a **new terminal** and navigate back to the root `ai-invoice-generator` directory)
    ```bash
    # Navigate to the frontend folder
    cd frontend/invoice-generator 

    # Install frontend dependencies
    npm install

    # Run the frontend development server
    npm start
    ```

Your backend will now be running (usually on `http://localhost:8000`) and your frontend will be running (usually on `http://localhost:3000`).