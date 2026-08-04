using Smart_team_project.DTOs.Matching;
using Smart_team_project.Models.Entities;

namespace Smart_team_project.Interfaces.Services
{
    public interface IMatchingService
    {
        MatchResultDto Calculate(
            IEnumerable<string> candidateSkills,
            int candidateYearsOfExperience,
            string candidateEducation,
            string candidateLocation,
            IEnumerable<string> requiredSkills,
            int requiredExperience,
            string educationRequirement,
            string vacancyLocation);

        MatchResultDto Calculate(JobSeekerProfile profile, Vacancy vacancy);

        Task<MatchResultDto?> GetMatchForUserAsync(int jobSeekerUserId, int vacancyId, CancellationToken cancellationToken = default);
    }
}
