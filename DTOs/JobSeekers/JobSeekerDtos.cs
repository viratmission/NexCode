using System.ComponentModel.DataAnnotations;

namespace Smart_team_project.DTOs.JobSeekers
{
    public class JobSeekerProfileDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string ProfessionalTitle { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public int YearsOfExperience { get; set; }
        public string Education { get; set; } = string.Empty;
        public string About { get; set; } = string.Empty;
        public List<string> Skills { get; set; } = new();
        public CvDocumentDto? CvDocument { get; set; }
    }

    public class UpdateJobSeekerProfileDto
    {
        [Required, MaxLength(200)]
        public string ProfessionalTitle { get; set; } = string.Empty;

        [Required, MaxLength(150)]
        public string Location { get; set; } = string.Empty;

        [Range(0, 50)]
        public int YearsOfExperience { get; set; }

        [Required, MaxLength(200)]
        public string Education { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string About { get; set; } = string.Empty;

        public List<string> Skills { get; set; } = new();
    }

    public class CvDocumentDto
    {
        public int Id { get; set; }
        public string OriginalFileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public DateTime UploadedAt { get; set; }
    }

    public class JobSeekerDashboardDto
    {
        public string FullName { get; set; } = string.Empty;
        public int ProfileCompletionPercent { get; set; }
        public int SkillCount { get; set; }
        public int OpenMatchingJobs { get; set; }
        public int ApplicationCount { get; set; }
        public int? BestMatchScore { get; set; }
        public List<RecommendedJobDto> RecommendedJobs { get; set; } = new();
        public List<RecentApplicationDto> RecentApplications { get; set; } = new();
    }

    public class RecommendedJobDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public int MatchScore { get; set; }
        public int MissingSkillsCount { get; set; }
    }

    public class RecentApplicationDto
    {
        public int Id { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public int MatchScore { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime AppliedAt { get; set; }
    }
}
