using Smart_team_project.Models.Enums;

namespace Smart_team_project.Models.Entities
{
    public class ContactRequest
    {
        public int Id { get; set; }
        public int EmployerId { get; set; }
        public int JobSeekerId { get; set; }
        public int VacancyId { get; set; }
        public ContactRequestStatus Status { get; set; } = ContactRequestStatus.Pending;
        public DateTime CreatedAt { get; set; }
        public DateTime? RespondedAt { get; set; }

        public User Employer { get; set; } = null!;
        public User JobSeeker { get; set; } = null!;
        public Vacancy Vacancy { get; set; } = null!;
    }
}
