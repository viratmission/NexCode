using Microsoft.EntityFrameworkCore;
using Smart_team_project.Models.Entities;

namespace Smart_team_project.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<JobSeekerProfile> JobSeekerProfiles => Set<JobSeekerProfile>();
        public DbSet<EmployerProfile> EmployerProfiles => Set<EmployerProfile>();
        public DbSet<Skill> Skills => Set<Skill>();
        public DbSet<JobSeekerSkill> JobSeekerSkills => Set<JobSeekerSkill>();
        public DbSet<Vacancy> Vacancies => Set<Vacancy>();
        public DbSet<VacancySkill> VacancySkills => Set<VacancySkill>();
        public DbSet<JobApplication> JobApplications => Set<JobApplication>();
        public DbSet<ContactRequest> ContactRequests => Set<ContactRequest>();
        public DbSet<Notification> Notifications => Set<Notification>();
        public DbSet<CvDocument> CvDocuments => Set<CvDocument>();
        public DbSet<ApplicationSetting> ApplicationSettings => Set<ApplicationSetting>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        }
    }
}
