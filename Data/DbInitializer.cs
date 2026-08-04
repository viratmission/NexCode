using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Smart_team_project.Models.Entities;
using Smart_team_project.Models.Enums;

namespace Smart_team_project.Data
{
    public static class DbInitializer
    {
        private const string DemoPassword = "Password123!";

        // Required seed skills from the MatchPoint specification.
        private static readonly string[] SeedSkills =
        [
            "C#",
            "ASP.NET Core",
            "ASP.NET Web API",
            "Entity Framework Core",
            "SQL Server",
            "JavaScript",
            "HTML",
            "CSS",
            "React",
            "Git",
            "REST API",
            "Postman",
            "Azure",
            "Software Testing"
        ];

        public static async Task SeedAsync(AppDbContext context, ILogger logger, CancellationToken cancellationToken = default)
        {
            // Seed development data only when the database has no users.
            if (await context.Users.AnyAsync(cancellationToken))
            {
                logger.LogInformation("Database already contains users. Skipping seed data.");
                return;
            }

            var passwordHasher = new PasswordHasher<User>();

            await SeedSettingsAsync(context, cancellationToken);
            var skills = await SeedSkillsAsync(context, cancellationToken);

            var admin = await CreateUserAsync(
                context,
                passwordHasher,
                "admin@demo.com",
                "System Administrator",
                UserRole.Administrator,
                cancellationToken);

            var employer = await CreateUserAsync(
                context,
                passwordHasher,
                "hr@demo.com",
                "NovaTech HR",
                UserRole.Employer,
                cancellationToken);

            var jobSeeker = await CreateUserAsync(
                context,
                passwordHasher,
                "maya@demo.com",
                "Maya Fernando",
                UserRole.JobSeeker,
                cancellationToken);

            await SeedEmployerProfileAsync(context, employer, cancellationToken);
            await SeedJobSeekerProfileAsync(context, jobSeeker, skills, cancellationToken);
            await SeedVacanciesAsync(context, employer, skills, cancellationToken);

            logger.LogInformation(
                "Database seeding completed. Demo accounts: maya@demo.com, hr@demo.com, admin@demo.com (password {Password}).",
                DemoPassword);
        }

        private static async Task SeedSettingsAsync(AppDbContext context, CancellationToken cancellationToken)
        {
            context.ApplicationSettings.Add(new ApplicationSetting
            {
                ApplicationName = "MatchPoint",
                DefaultPageSize = 10,
                MaintenanceMessage = string.Empty,
                UpdatedAt = DateTime.UtcNow
            });

            await context.SaveChangesAsync(cancellationToken);
        }

        private static async Task<Dictionary<string, Skill>> SeedSkillsAsync(AppDbContext context, CancellationToken cancellationToken)
        {
            var lookup = new Dictionary<string, Skill>(StringComparer.OrdinalIgnoreCase);

            foreach (var name in SeedSkills)
            {
                var skill = new Skill { Name = name };
                context.Skills.Add(skill);
                lookup[name] = skill;
            }

            await context.SaveChangesAsync(cancellationToken);
            return lookup;
        }

        private static async Task<User> CreateUserAsync(
            AppDbContext context,
            PasswordHasher<User> passwordHasher,
            string email,
            string fullName,
            UserRole role,
            CancellationToken cancellationToken)
        {
            var now = DateTime.UtcNow;

            var user = new User
            {
                FullName = fullName,
                Email = email.Trim().ToLowerInvariant(),
                Role = role,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            };

            user.PasswordHash = passwordHasher.HashPassword(user, DemoPassword);

            context.Users.Add(user);
            await context.SaveChangesAsync(cancellationToken);

            return user;
        }

        private static async Task SeedEmployerProfileAsync(AppDbContext context, User employer, CancellationToken cancellationToken)
        {
            var now = DateTime.UtcNow;

            context.EmployerProfiles.Add(new EmployerProfile
            {
                UserId = employer.Id,
                CompanyName = "NovaTech Solutions",
                Industry = "Information Technology",
                Location = "Colombo",
                Description = "NovaTech Solutions builds modern web platforms for Sri Lankan businesses using ASP.NET Core, SQL Server and JavaScript.",
                CreatedAt = now,
                UpdatedAt = now
            });

            await context.SaveChangesAsync(cancellationToken);
        }

        private static async Task SeedJobSeekerProfileAsync(
            AppDbContext context,
            User jobSeeker,
            Dictionary<string, Skill> skills,
            CancellationToken cancellationToken)
        {
            var now = DateTime.UtcNow;

            var profile = new JobSeekerProfile
            {
                UserId = jobSeeker.Id,
                ProfessionalTitle = "Junior .NET Developer",
                Location = "Colombo",
                YearsOfExperience = 2,
                Education = "Bachelor of Science in Computer Science",
                About = "Aspiring .NET developer with hands-on experience in ASP.NET Core Web APIs, Entity Framework Core and SQL Server.",
                CreatedAt = now,
                UpdatedAt = now
            };

            foreach (var name in new[]
                     {
                         "C#", "ASP.NET Core", "ASP.NET Web API", "Entity Framework Core",
                         "SQL Server", "JavaScript", "HTML", "CSS", "Git", "REST API"
                     })
            {
                if (skills.TryGetValue(name, out var skill))
                {
                    profile.JobSeekerSkills.Add(new JobSeekerSkill { Skill = skill });
                }
            }

            context.JobSeekerProfiles.Add(profile);
            await context.SaveChangesAsync(cancellationToken);
        }

        private static async Task SeedVacanciesAsync(
            AppDbContext context,
            User employer,
            Dictionary<string, Skill> skills,
            CancellationToken cancellationToken)
        {
            var now = DateTime.UtcNow;

            var definitions = new (string Title, string Description, string Location, int Experience, string Education, string[] Skills, int DaysAgo)[]
            {
                (
                    "Junior .NET Developer",
                    "Join NovaTech Solutions as a Junior .NET Developer. You will build and maintain ASP.NET Core Web APIs with Entity Framework Core and SQL Server.",
                    "Colombo",
                    1,
                    "Bachelor",
                    ["C#", "ASP.NET Core", "Entity Framework Core", "SQL Server", "Git"],
                    2
                ),
                (
                    "ASP.NET Core Developer",
                    "Develop secure REST APIs using ASP.NET Core and ASP.NET Web API. Collaborate with frontend engineers and write clean, testable C# code.",
                    "Colombo",
                    2,
                    "Bachelor",
                    ["C#", "ASP.NET Core", "ASP.NET Web API", "REST API", "SQL Server", "Postman"],
                    4
                ),
                (
                    "Frontend Developer",
                    "Create responsive user interfaces with HTML, CSS, JavaScript and React for recruitment and HR products.",
                    "Kandy",
                    2,
                    "Bachelor",
                    ["HTML", "CSS", "JavaScript", "React", "Git"],
                    6
                ),
                (
                    "Backend Developer",
                    "Own backend services for MatchPoint-style platforms. Focus on ASP.NET Core, Entity Framework Core and SQL Server performance.",
                    "Galle",
                    3,
                    "Bachelor",
                    ["C#", "ASP.NET Core", "Entity Framework Core", "SQL Server", "REST API", "Azure"],
                    8
                ),
                (
                    "QA Engineer",
                    "Design manual and exploratory test plans for web APIs and UIs. Use Postman for API testing and collaborate closely with developers.",
                    "Negombo",
                    1,
                    "Diploma",
                    ["Software Testing", "Postman", "REST API", "Git"],
                    10
                ),
                (
                    "Database Developer",
                    "Model relational schemas, write efficient SQL Server queries and support Entity Framework Core mappings for production systems.",
                    "Jaffna",
                    2,
                    "Bachelor",
                    ["SQL Server", "Entity Framework Core", "C#", "REST API"],
                    12
                ),
                (
                    "Software Engineering Intern",
                    "Learn full-stack development with C#, ASP.NET Core, HTML, CSS and JavaScript while contributing to real product features.",
                    "Batticaloa",
                    0,
                    "Diploma",
                    ["C#", "ASP.NET Core", "HTML", "CSS", "JavaScript", "Git"],
                    14
                )
            };

            foreach (var definition in definitions)
            {
                var createdAt = now.AddDays(-definition.DaysAgo);

                var vacancy = new Vacancy
                {
                    EmployerId = employer.Id,
                    Title = definition.Title,
                    Description = definition.Description,
                    Location = definition.Location,
                    RequiredExperience = definition.Experience,
                    EducationRequirement = definition.Education,
                    Status = VacancyStatus.Open,
                    CreatedAt = createdAt,
                    UpdatedAt = createdAt
                };

                foreach (var skillName in definition.Skills)
                {
                    if (skills.TryGetValue(skillName, out var skill))
                    {
                        vacancy.VacancySkills.Add(new VacancySkill { Skill = skill });
                    }
                }

                context.Vacancies.Add(vacancy);
            }

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
