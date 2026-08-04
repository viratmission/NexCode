using Microsoft.Extensions.Options;
using Smart_team_project.Caching;
using Smart_team_project.DTOs.Matching;
using Smart_team_project.Interfaces.Repositories;
using Smart_team_project.Interfaces.Services;
using Smart_team_project.Models.Entities;
using Smart_team_project.Options;

namespace Smart_team_project.Services
{
    /// <summary>
    /// Deterministic rule-based matching.
    /// Component scores are 0–100; TotalScore applies configured weights that must total 100.
    /// </summary>
    public class MatchingService : IMatchingService
    {
        private readonly MatchingOptions _matchingOptions;
        private readonly CacheOptions _cacheOptions;
        private readonly IJobSeekerRepository _jobSeekerRepository;
        private readonly IJobRepository _jobRepository;
        private readonly ICacheService _cache;

        public MatchingService(
            IOptions<MatchingOptions> matchingOptions,
            IOptions<CacheOptions> cacheOptions,
            IJobSeekerRepository jobSeekerRepository,
            IJobRepository jobRepository,
            ICacheService cache)
        {
            _matchingOptions = matchingOptions.Value;
            _matchingOptions.Validate();
            _cacheOptions = cacheOptions.Value;
            _jobSeekerRepository = jobSeekerRepository;
            _jobRepository = jobRepository;
            _cache = cache;
        }

        public MatchResultDto Calculate(
            IEnumerable<string> candidateSkills,
            int candidateYearsOfExperience,
            string candidateEducation,
            string candidateLocation,
            IEnumerable<string> requiredSkills,
            int requiredExperience,
            string educationRequirement,
            string vacancyLocation)
        {
            var candidate = Normalize(candidateSkills);
            var required = Normalize(requiredSkills);

            var matched = required.Where(candidate.Contains).OrderBy(s => s, StringComparer.OrdinalIgnoreCase).ToList();
            var missing = required.Where(skill => !candidate.Contains(skill)).OrderBy(s => s, StringComparer.OrdinalIgnoreCase).ToList();

            // SkillsScore = matched / required × 100 (0–100)
            var skillsScore = required.Count == 0
                ? 100
                : (int)Math.Round(matched.Count / (double)required.Count * 100.0, MidpointRounding.AwayFromZero);

            var experienceScore = CalculateExperienceScore(candidateYearsOfExperience, requiredExperience);
            var educationScore = CalculateEducationScore(candidateEducation, educationRequirement);
            var locationScore = CalculateLocationScore(candidateLocation, vacancyLocation);

            // Weighted components, then round the sum to a whole number between 0 and 100.
            var skillsComponent = skillsScore * _matchingOptions.SkillsWeight / 100.0;
            var experienceComponent = experienceScore * _matchingOptions.ExperienceWeight / 100.0;
            var educationComponent = educationScore * _matchingOptions.EducationWeight / 100.0;
            var locationComponent = locationScore * _matchingOptions.LocationWeight / 100.0;

            var total = (int)Math.Round(
                skillsComponent + experienceComponent + educationComponent + locationComponent,
                MidpointRounding.AwayFromZero);

            return new MatchResultDto
            {
                TotalScore = Math.Clamp(total, 0, 100),
                SkillsScore = Math.Clamp(skillsScore, 0, 100),
                ExperienceScore = Math.Clamp(experienceScore, 0, 100),
                EducationScore = Math.Clamp(educationScore, 0, 100),
                LocationScore = Math.Clamp(locationScore, 0, 100),
                MatchedSkills = matched,
                MissingSkills = missing
            };
        }

        public MatchResultDto Calculate(JobSeekerProfile profile, Vacancy vacancy)
        {
            var candidateSkills = profile.JobSeekerSkills
                .Where(s => s.Skill != null)
                .Select(s => s.Skill.Name)
                .ToList();

            var requiredSkills = vacancy.VacancySkills
                .Where(s => s.Skill != null)
                .Select(s => s.Skill.Name)
                .ToList();

            return Calculate(
                candidateSkills,
                profile.YearsOfExperience,
                profile.Education,
                profile.Location,
                requiredSkills,
                vacancy.RequiredExperience,
                vacancy.EducationRequirement,
                vacancy.Location);
        }

        public async Task<MatchResultDto?> GetMatchForUserAsync(int jobSeekerUserId, int vacancyId, CancellationToken cancellationToken = default)
        {
            var cacheKey = CacheKeys.Match(jobSeekerUserId, vacancyId);
            var cached = _cache.Get<MatchResultDto>(cacheKey);
            if (cached != null)
            {
                return cached;
            }

            var profile = await _jobSeekerRepository.GetByUserIdAsync(jobSeekerUserId, cancellationToken);
            if (profile == null)
            {
                return null;
            }

            var vacancy = await _jobRepository.GetByIdAsync(vacancyId, cancellationToken);
            if (vacancy == null)
            {
                return null;
            }

            var result = Calculate(profile, vacancy);
            _cache.Set(cacheKey, result, TimeSpan.FromMinutes(_cacheOptions.MatchMinutes));
            return result;
        }

        private static int CalculateExperienceScore(int candidateYears, int requiredYears)
        {
            if (requiredYears <= 0)
            {
                return 100;
            }

            var ratio = Math.Min(candidateYears / (double)requiredYears, 1.0);
            return (int)Math.Round(ratio * 100.0, MidpointRounding.AwayFromZero);
        }

        private static int CalculateEducationScore(string candidateEducation, string educationRequirement)
        {
            if (string.IsNullOrWhiteSpace(educationRequirement))
            {
                return 100;
            }

            if (string.IsNullOrWhiteSpace(candidateEducation))
            {
                return 0;
            }

            var candidate = candidateEducation.Trim().ToLowerInvariant();
            var requirement = educationRequirement.Trim().ToLowerInvariant();

            if (candidate.Contains(requirement) || requirement.Contains(candidate))
            {
                return 100;
            }

            return 0;
        }

        private static int CalculateLocationScore(string candidateLocation, string vacancyLocation)
        {
            if (string.IsNullOrWhiteSpace(vacancyLocation))
            {
                return 100;
            }

            if (string.IsNullOrWhiteSpace(candidateLocation))
            {
                return 0;
            }

            var candidate = candidateLocation.Trim().ToLowerInvariant();
            var vacancy = vacancyLocation.Trim().ToLowerInvariant();

            return string.Equals(candidate, vacancy, StringComparison.Ordinal)
                ? 100
                : 0;
        }

        private static HashSet<string> Normalize(IEnumerable<string> values)
        {
            return values
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Select(value => value.Trim())
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
        }
    }
}
