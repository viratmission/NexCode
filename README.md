# MatchPoint — Smart Recruitment Matching Platform

MatchPoint is a complete ASP.NET Core Web API application that connects **Job Seekers**, **Employers**, and **Administrators** with deterministic, rule-based job matching.

Product name: **MatchPoint**  
Project name: `Smart_team_project` (preserved Visual Studio solution/project)  
Target framework: **.NET 8.0**

---

## Features

- Registration and JWT login with role-based authorization
- Job Seeker profile, skills, and CV upload
- Employer company profile and vacancy management
- Rule-based match scoring (skills, experience, education, location)
- Matched / missing skill display
- Job search, filtering, and pagination
- Job applications with duplicate prevention (unique index + 409 Conflict)
- Applicant ranking by match score
- Application status workflow with in-app notifications
- Employer contact requests (accept / decline)
- Administrator dashboard, user enable/disable, and basic settings
- `IMemoryCache` with invalidation for vacancies, matches, and dashboards
- Clean HTML / CSS / Vanilla JavaScript frontend served from `wwwroot`

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Backend | ASP.NET Core Web API (.NET 8) |
| ORM | Entity Framework Core 8 |
| Database | Microsoft SQL Server / SQL Server Express |
| Auth | JWT Bearer + `PasswordHasher<User>` |
| Cache | `IMemoryCache` |
| Frontend | HTML, CSS, Vanilla JavaScript (Fetch API) |
| Docs | Swagger / OpenAPI (Development) |

---

## Folder Structure

```
Smart_team_project/
├── Controllers/
├── Data/                 # AppDbContext, configurations, migrations, DbInitializer
├── Models/Entities/
├── Models/Enums/
├── DTOs/
├── Interfaces/Services/
├── Interfaces/Repositories/
├── Services/
├── Repositories/
├── Caching/
├── Options/
├── Middleware/
├── Helpers/
├── Storage/CVs/          # Physical CV files (outside wwwroot)
├── wwwroot/              # Frontend
├── Program.cs
├── appsettings.json
└── Smart_team_project.csproj
```

Internal flow:

```
HTML / CSS / JavaScript
        ↓
ASP.NET Core Controller
        ↓
Service Interface → Service Implementation
        ↓
Repository Interface → Repository Implementation
        ↓
EF Core DbContext → SQL Server
```

---

## Prerequisites

1. **Visual Studio Community 2022** (or later) with the ASP.NET and web development workload
2. **.NET 8 SDK**
3. **SQL Server Express** (or SQL Server / LocalDB)
4. **SQL Server Management Studio (SSMS)** — optional, for inspecting data
5. Trusted HTTPS development certificate (`dotnet dev-certs https --trust`)

No Node.js is required to run the frontend.

---

## Visual Studio Setup

1. Open `Smart_team_project.sln` (or the `.csproj` / `.slnx`) in Visual Studio Community.
2. Confirm the project targets **.NET 8.0**.
3. Restore NuGet packages (Visual Studio does this automatically).
4. Set the launch profile to **https**.
5. Press **F5** (or Ctrl+F5) to run.

On first Development startup the app will:

- Apply pending EF Core migrations
- Seed demo accounts, skills, and vacancies (only when the database has no users)

---

## SQL Server Connection Setup

Default connection string in `appsettings.json` / `appsettings.Development.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=.\\SQLEXPRESS;Database=SmartRecruitmentDb;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
}
```

### Development default (LocalDB)

`appsettings.Development.json` is preconfigured for LocalDB so the project runs without SQL Express:

```json
"DefaultConnection": "Server=(localdb)\\MSSQLLocalDB;Database=SmartRecruitmentDb;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
```

When SQL Server Express is installed, switch Development to the `.\SQLEXPRESS` connection string from `appsettings.json`.

### If your SQL Express instance name differs

Update `Server=.\\SQLEXPRESS` to your instance name (for example `Server=localhost\\SQLEXPRESS` or `Server=.`).

Do **not** create tables manually in SSMS. Use EF Core migrations.

---

## EF Core Migration Commands

From the project folder in a Developer PowerShell / Terminal:

```powershell
dotnet tool install --global dotnet-ef --version 8.0.11
dotnet ef migrations add InitialCreate
dotnet ef database update
```

The `InitialCreate` migration already exists under `Data/Migrations/`.  
Normally you only need:

```powershell
dotnet ef database update
```

Or simply run the app in Development — migrations are applied automatically.

---

## How to Run

### Visual Studio

1. Open the solution
2. Select the **https** profile
3. Press **F5**

### Command line

```powershell
cd C:\Users\saran\OneDrive\Desktop\Smart_team_project
dotnet restore
dotnet build
dotnet run --launch-profile https
```

---

## URLs

| Resource | URL |
|----------|-----|
| Frontend (home) | `https://localhost:7030/` |
| Login | `https://localhost:7030/login.html` |
| Swagger | `https://localhost:7030/swagger` |
| HTTP fallback | `http://localhost:5204/` |

Ports come from `Properties/launchSettings.json` (preserved from the original project).

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Job Seeker | `maya@demo.com` | `Password123!` |
| Employer | `hr@demo.com` | `Password123!` |
| Administrator | `admin@demo.com` | `Password123!` |

Company (employer): **NovaTech Solutions**

---

## Main API Endpoints

### Auth
- `POST /api/auth/register/job-seeker`
- `POST /api/auth/register/employer`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Job Seeker
- `GET/PUT /api/job-seekers/profile`
- `POST /api/job-seekers/cv`
- `GET /api/job-seekers/applications`
- `GET /api/job-seekers/contact-requests`
- `PUT /api/job-seekers/contact-requests/{id}`
- `GET /api/job-seekers/dashboard`

### Jobs / Vacancies
- `GET /api/jobs` — open vacancy search
- `GET /api/jobs/{id}` — details + match result for job seekers
- `POST /api/jobs/{jobId}/applications` — apply
- `GET /api/jobs/mine` — employer vacancies
- `POST /api/jobs` — create vacancy
- `PUT /api/jobs/{id}` — update
- `PATCH /api/jobs/{id}/close`
- `GET /api/jobs/{id}/applicants` — ranked applicants

### Employer applications
- `GET /api/applications`
- `GET /api/applications/{id}`
- `PUT /api/applications/{id}/status`
- `GET /api/applications/{id}/cv`
- `POST /api/contact-requests/applications/{applicationId}`

### Notifications
- `GET /api/notifications`
- `PUT /api/notifications/{id}/read`
- `PUT /api/notifications/read-all`

### Admin
- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `PUT /api/admin/users/{id}/status`
- `GET/PUT /api/admin/settings`

---

## Matching Formula

Weights (configured in `appsettings`, must total 100):

| Component | Weight |
|-----------|--------|
| Skills | 60 |
| Experience | 20 |
| Education | 10 |
| Location | 10 |

**Skills score** = matched required skills ÷ total required skills × 100  

**Experience score** = if required is 0 → 100; else `min(candidate / required, 1) × 100`  

**Education score** = 100 when texts contain each other (normalized); else 0 (or 100 if requirement empty)  

**Location score** = 100 for exact normalized match (or empty vacancy location); else 0  

**Total** = round(sum of weighted components) clamped to 0–100  

Matching uses structured profile data only. Uploaded CVs are supporting documents and are **not** parsed.

---

## Security Notes

- Passwords are hashed with `PasswordHasher<User>` (Identity hasher without full Identity UI)
- JWT contains user id, email, full name, and role
- Backend enforces `[Authorize(Roles = ...)]` on every protected endpoint
- Frontend guards are convenience only — never trust them alone
- Development JWT key is not a production secret — replace before deployment
- Password hashes and JWT tokens are never cached
- CVs are not served as static files

---

## CV Storage Notes

- Physical files live in `Storage/CVs/` (outside `wwwroot`)
- SQL Server stores metadata only (`CvDocuments` table)
- Allowed types: `.pdf`, `.doc`, `.docx`
- Max size: **5 MB**
- Employers can download a candidate CV only when that candidate applied to an employer-owned vacancy
- Relative storage paths are never exposed as absolute server paths in API responses

---

## Troubleshooting

### SQL Server connection failure
- Confirm SQL Server Express is installed and running (Services → `SQL Server (SQLEXPRESS)`)
- Verify the connection string instance name
- Enable TCP/IP if connecting remotely
- Try `TrustServerCertificate=True`

### SQLEXPRESS not found
- Use LocalDB connection string (see above)
- Or install SQL Server Express from Microsoft

### Migration failure
```powershell
dotnet ef database drop --force
dotnet ef database update
```
Or delete the database in SSMS and restart the app.

### Port already in use
Change ports in `Properties/launchSettings.json`, or stop the process using ports `7030` / `5204`:
```powershell
netstat -ano | findstr :7030
taskkill /PID <pid> /F
```

### HTTPS certificate issue
```powershell
dotnet dev-certs https --clean
dotnet dev-certs https --trust
```

### Invalid JWT
- Log in again to obtain a fresh token
- Confirm `Jwt:Key`, `Issuer`, and `Audience` match between config and token generation
- Check system clock / token expiry

### CORS issue
The frontend is served from the same ASP.NET Core host (`wwwroot`), so CORS is not required for normal browser use. If you host the UI separately, add an explicit CORS policy.

### CV folder permission
Ensure the app process can write to `Storage/CVs/`. Create the folder if missing (a `.gitkeep` is included).

### Database already exists
Seeding runs only when there are **no users**. To reseed, drop the database and restart, or delete all `Users` rows and restart in Development.

---

## License / Course Use

Built as a complete teaching-friendly recruitment matching platform for Visual Studio Community and .NET 8.
