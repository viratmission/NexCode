using Smart_team_project.Models.Enums;

namespace Smart_team_project.Models.Entities
{
    public class JobApplication
    {
        public int Id { get; set; }
        public int VacancyId { get; set; }
        public int JobSeekerId { get; set; }
        public int MatchScore { get; set; }
        public ApplicationStatus Status { get; set; } = ApplicationStatus.Applied;
        public DateTime AppliedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public Vacancy Vacancy { get; set; } = null!;
        public User JobSeeker { get; set; } = null!;
    }
}
