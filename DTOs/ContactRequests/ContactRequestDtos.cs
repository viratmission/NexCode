using System.ComponentModel.DataAnnotations;

namespace Smart_team_project.DTOs.ContactRequests
{
    public class ContactRequestDto
    {
        public int Id { get; set; }
        public int EmployerId { get; set; }
        public string EmployerName { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public int JobSeekerId { get; set; }
        public string JobSeekerName { get; set; } = string.Empty;
        public int VacancyId { get; set; }
        public string VacancyTitle { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? RespondedAt { get; set; }
    }

    public class RespondToContactRequestDto
    {
        [Required]
        public string Status { get; set; } = string.Empty;
    }
}
