using Smart_team_project.Models.Enums;

namespace Smart_team_project.Models.Entities
{
    public class Vacancy
    {
        public int Id { get; set; }
        public int EmployerId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public int RequiredExperience { get; set; }
        public string EducationRequirement { get; set; } = string.Empty;
        public VacancyStatus Status { get; set; } = VacancyStatus.Open;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? ClosedAt { get; set; }

        public User Employer { get; set; } = null!;
        public ICollection<VacancySkill> VacancySkills { get; set; } = new List<VacancySkill>();
        public ICollection<JobApplication> JobApplications { get; set; } = new List<JobApplication>();
        public ICollection<ContactRequest> ContactRequests { get; set; } = new List<ContactRequest>();
    }
}
