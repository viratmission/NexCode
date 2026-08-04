using Smart_team_project.Models.Enums;

namespace Smart_team_project.Models.Entities
{
    public class User
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public JobSeekerProfile? JobSeekerProfile { get; set; }
        public EmployerProfile? EmployerProfile { get; set; }
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        public ICollection<JobApplication> Applications { get; set; } = new List<JobApplication>();
        public ICollection<ContactRequest> ContactRequestsAsEmployer { get; set; } = new List<ContactRequest>();
        public ICollection<ContactRequest> ContactRequestsAsJobSeeker { get; set; } = new List<ContactRequest>();
        public ICollection<Vacancy> Vacancies { get; set; } = new List<Vacancy>();
    }
}
