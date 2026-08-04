using System.ComponentModel.DataAnnotations;
using Smart_team_project.DTOs.JobSeekers;
using Smart_team_project.DTOs.Matching;

namespace Smart_team_project.DTOs.Applications
{
    public class ApplicationDto
    {
        public int Id { get; set; }
        public int VacancyId { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public int MatchScore { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime AppliedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class ApplicantListDto
    {
        public int Rank { get; set; }
        public int ApplicationId { get; set; }
        public int CandidateId { get; set; }
        public string CandidateName { get; set; } = string.Empty;
        public string ProfessionalTitle { get; set; } = string.Empty;
        public int Experience { get; set; }
        public string Education { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public int MatchScore { get; set; }
        public string ApplicationStatus { get; set; } = string.Empty;
        public DateTime AppliedAt { get; set; }
        public List<string> MatchedSkills { get; set; } = new();
        public List<string> MissingSkills { get; set; } = new();
        public int VacancyId { get; set; }
        public string JobTitle { get; set; } = string.Empty;
    }

    public class ApplicantDetailsDto
    {
        public int ApplicationId { get; set; }
        public int CandidateId { get; set; }
        public string CandidateName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string ProfessionalTitle { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public int Experience { get; set; }
        public string Education { get; set; } = string.Empty;
        public string About { get; set; } = string.Empty;
        public List<string> Skills { get; set; } = new();
        public int MatchScore { get; set; }
        public MatchResultDto MatchBreakdown { get; set; } = null!;
        public string ApplicationStatus { get; set; } = string.Empty;
        public DateTime AppliedAt { get; set; }
        public int VacancyId { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        public bool HasCv { get; set; }
        public bool ContactRequestPending { get; set; }
        public CvDocumentDto? CvDocument { get; set; }
    }

    public class UpdateApplicationStatusDto
    {
        [Required]
        public string Status { get; set; } = string.Empty;
    }
}
