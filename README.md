# 🎓 EduHub - Smart College Management System

> **⚠️ Status:** Development Version (v2.0-BIO)
> This project is currently in active development. Features are subject to change and optimization.

EduHub is a premium, modern Single Page Application (SPA) designed to streamline college operations through advanced technology. It features AI-powered biometric attendance, real-time financial tracking, and a comprehensive student portal.

---

## ✨ Key Features

- **🛡️ Advanced Authentication**: Role-based access control (Admin & Student) powered by Supabase Auth.
- **👁️ AI Biometric Attendance**: Automated face recognition system for hands-free attendance marking.
- **📱 QR Scanner**: Fast attendance marking via student QR codes.
- **📊 Dynamic Dashboard**: Real-time analytics, financial health charts, and attendance trends.
- **💳 Financial Management**: Track paid and outstanding fees with automated receipt status.
- **👤 Student Portal**: Personalized dashboard for students to view their own attendance and financial records.
- **📸 Smart Storage**: Robust image handling with Supabase Storage fallback (Base64).

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Supabase Account**: For database and authentication.

### Installation

1. **Clone the repository**:
   ```bash
   git clone git@github.com:zakirjarir/EduFlow.git
   cd EduHub
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   Create a `.env` file in the root directory and add the following keys:

   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL="your-project-url"
   VITE_SUPABASE_ANON_KEY="your-anon-key"

   # AI Configuration (Optional for Gemini integration)
   VITE_GEMINI_API_KEY="your-gemini-key"
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

---

## 🛠️ Database Setup (Supabase)

To get the system fully operational, run the contents of `supabase_schema.sql` in your Supabase SQL Editor.

### Important Configuration:
1. **Storage Bucket**: Create a **Public** bucket named `student-portraits` in Supabase Storage.
2. **RLS Policies**: Run the following SQL to allow image uploads:
   ```sql
   CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'student-portraits');
   CREATE POLICY "Public Select" ON storage.objects FOR SELECT USING (bucket_id = 'student-portraits');
   ```

### Admin Access:
To grant yourself Admin access, find your User ID from the Supabase Auth tab and run:
```sql
INSERT INTO profiles (id, email, role) 
VALUES ('YOUR_USER_UUID', 'your@email.com', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

---

## 📸 Biometric Engine

The face recognition system uses `face-api.js`. 
- **Auto-Detect**: System automatically recognizes faces without manual buttons.
- **Camera Switch**: Supports toggling between user (front) and environment (back) cameras on mobile devices.
- **Training**: AI models are trained on-the-fly based on registered student portraits.

---

## 📦 Tech Stack

- **Frontend**: Vue 3 (Composition API), TypeScript, Vite.
- **Styling**: Tailwind CSS (Premium UI Components).
- **Backend**: Supabase (PostgreSQL, Auth, Storage).
- **AI/Biometrics**: Face-api.js.
- **Icons**: Lucide Vue Next.

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Developed with ❤️ by [Zakir Jarir](https://github.com/zakirjarir)**
