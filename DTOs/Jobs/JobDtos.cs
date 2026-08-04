using System.ComponentModel.DataAnnotations;
using Smart_team_project.DTOs.Matching;

namespace Smart_team_project.DTOs.Jobs
{
    public class CreateVacancyDto
    {
        [Required, MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required, MaxLength(5000)]
        public string Description { get; set; } = string.Empty;

        [Required, MaxLength(150)]
        public string Location { get; set; } = string.Empty;

        [Range(0, 50)]
        public int RequiredExperience { get; set; }

        [MaxLength(200)]
        public string EducationRequirement { get; set; } = string.Empty;

        [MinLength(1, ErrorMessage = "At least one required skill is needed.")]
        public List<string> RequiredSkills { get; set; } = new();
    }

    public class UpdateVacancyDto
    {
        [Required, MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required, MaxLength(5000)]
        public string Description { get; set; } = string.Empty;

        [Required, MaxLength(150)]
        public string Location { get; set; } = string.Empty;

        [Range(0, 50)]
        public int RequiredExperience { get; set; }

        [MaxLength(200)]
        public string EducationRequirement { get; set; } = string.Empty;

        [MinLength(1, ErrorMessage = "At least one required skill is needed.")]
        public List<string> RequiredSkills { get; set; } = new();
    }

    public class VacancyListDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public int RequiredExperience { get; set; }
        public List<string> RequiredSkills { get; set; } = new();
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public int? MatchScore { get; set; }
        public int? MissingSkillsCount { get; set; }
        public int ApplicantCount { get; set; }
    }

    public class VacancyDetailsDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int RequiredExperience { get; set; }
        public string EducationRequirement { get; set; } = string.Empty;
        public List<string> RequiredSkills { get; set; } = new();
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? ClosedAt { get; set; }
    }

    public class JobSearchRequestDto
    {
        public string? Search { get; set; }
        public string? Location { get; set; }
        public int? MinimumMatch { get; set; }
        public int? MinimumExperience { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public class JobDetailsResponseDto
    {
        public VacancyDetailsDto Job { get; set; } = null!;
        public MatchResultDto? MatchResult { get; set; }
        public bool AlreadyApplied { get; set; }
    }
}
