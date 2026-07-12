# 🚛 TransitOps

**Smart Transport Operations Platform**

TransitOps is a full-stack, security-first web application designed for logistics fleets. It provides a comprehensive solution for tracking vehicles, dispatching drivers, managing trips, and analyzing operational costs, all strictly governed by Role-Based Access Control (RBAC).

---

## 🌟 Features

*   **Role-Based Access Control (RBAC)**: Secure access tailored for Fleet Managers, Drivers, Safety Officers, and Financial Analysts using Supabase Row Level Security.
*   **Vehicle Registry & Maintenance**: Track fleet assets, real-time statuses (Available, On Trip, In Shop), load capacities, odometers, and maintenance logs.
*   **Driver Management**: Manage driver profiles, track safety scores, and monitor license expiries.
*   **Trip Dispatching**: Create, dispatch, and complete trips. Automated database triggers handle driver and vehicle status updates seamlessly.
*   **Fuel & Expense Logging**: Track operational costs at the granular trip and vehicle level.
*   **Analytics Dashboard**: Visual KPIs and real-time metrics for fleet operations and financial ROI.
*   **Premium UI**: A stunning, responsive, glassmorphism-inspired design system built with Tailwind CSS.

## 🛠️ Technology Stack

*   **Frontend**: React 18, Vite, TypeScript, React Router
*   **Styling**: Tailwind CSS, Lucide React (Icons), Recharts (Charts)
*   **Backend & Database**: Supabase (PostgreSQL)
*   **Authentication**: Supabase Auth
*   **Security**: PostgreSQL Row Level Security (RLS) & Triggers
*   **Date Formatting**: date-fns

---

## 🚀 Getting Started (Local Development)

### Prerequisites
*   Node.js (v18+)
*   A [Supabase](https://supabase.com) account

### 1. Clone & Install
```bash
git clone https://github.com/your-username/TransitOps.git
cd TransitOps
npm install
```

### 2. Set up Supabase
1. Create a new project on [Supabase](https://supabase.com).
2. Go to **Project Settings -> API** and copy your **Project URL** and **Publishable (anon) Key**.
3. Create a `.env.local` file in the root of the project:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### 3. Run Database Migrations
In the Supabase Dashboard, open the **SQL Editor** and run the setup scripts found in `supabase/migrations/` in the following order:
1. `001_schema.sql` (Tables and Enums)
2. `002_rls_policies.sql` (Row Level Security)
3. `003_triggers.sql` (Automated Status Updates)
4. `004_views.sql` (Analytics Views)

*(Alternatively, you can copy the entire `all_in_one_setup.sql` if you merged them).*

### 4. Create an Admin User
Since self-signup is disabled for security, you must create the first user manually:
1. Go to **Authentication -> Users** in Supabase and click **Add User**.
2. Copy the newly created user's `UUID`.
3. Go to the SQL Editor and run:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('YOUR-UUID-HERE', 'fleet_manager');
   ```

### 5. Start the App
```bash
npm run dev
```
Navigate to `http://localhost:5173` and log in with the user you just created.

---

## 🔐 Roles & Permissions

The app strictly enforces data isolation via PostgreSQL Row Level Security (RLS):

| Role | Access Level |
| :--- | :--- |
| **Fleet Manager** | Full read/write access to all entities. Can manage users. |
| **Driver** | Can manage own trips, log fuel, and read own profile. Isolated by region. |
| **Safety Officer** | Read-only access to vehicles/trips. Full CRUD for driver safety records. |
| **Financial Analyst** | Read-only access to all financial data (fuel, expenses, maintenance, ROI). |

---

## 📂 Project Structure

```text
src/
├── components/   # Reusable UI components (Buttons, Modals, DataTables)
├── contexts/     # React Contexts (AuthContext)
├── lib/          # Utilities (Supabase client, Demo Data)
├── pages/        # Application Pages (Dashboard, Vehicles, Trips, etc.)
├── router/       # React Router setup and Role Guards
└── index.css     # Global styles and Tailwind directives

supabase/
└── migrations/   # SQL files for schema, RLS, triggers, and views
```

---

## 🚢 Deployment

1. Push your code to a GitHub repository.
2. Import the repository into [Vercel](https://vercel.com).
3. Add the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to Vercel's Environment Variables.
4. Deploy! Ensure you update the **Site URL** and **Redirect URLs** in your Supabase Authentication settings to match your new Vercel domain.

---

## 📄 License
This project is licensed under the MIT License.

For Information Regarding License Check LICENSE.md
