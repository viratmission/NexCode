using System.ComponentModel.DataAnnotations;

namespace Smart_team_project.DTOs.Employers
{
    public class EmployerProfileDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string Industry { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class UpdateEmployerProfileDto
    {
        [Required, MaxLength(200)]
        public string CompanyName { get; set; } = string.Empty;

        [Required, MaxLength(150)]
        public string Industry { get; set; } = string.Empty;

        [Required, MaxLength(150)]
        public string Location { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string Description { get; set; } = string.Empty;
    }

    public class EmployerDashboardDto
    {
        public string CompanyName { get; set; } = string.Empty;
        public int OpenVacancies { get; set; }
        public int ClosedVacancies { get; set; }
        public int TotalApplications { get; set; }
        public int UnderReview { get; set; }
        public int Shortlisted { get; set; }
        public int ContactRequests { get; set; }
        public List<RecentApplicantDto> RecentApplicants { get; set; } = new();
        public List<ActiveVacancyDto> ActiveVacancies { get; set; } = new();
    }

    public class RecentApplicantDto
    {
        public int ApplicationId { get; set; }
        public string CandidateName { get; set; } = string.Empty;
        public string JobTitle { get; set; } = string.Empty;
        public int MatchScore { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime AppliedAt { get; set; }
    }

    public class ActiveVacancyDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public int ApplicantCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
