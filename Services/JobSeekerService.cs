using Microsoft.Extensions.Options;
using Smart_team_project.Caching;
using Smart_team_project.DTOs.Applications;
using Smart_team_project.DTOs.Common;
using Smart_team_project.DTOs.ContactRequests;
using Smart_team_project.DTOs.JobSeekers;
using Smart_team_project.Exceptions;
using Smart_team_project.Helpers;
using Smart_team_project.Interfaces.Repositories;
using Smart_team_project.Interfaces.Services;
using Smart_team_project.Models.Entities;
using Smart_team_project.Models.Enums;
using Smart_team_project.Options;

namespace Smart_team_project.Services
{
    public class JobSeekerService : IJobSeekerService
    {
        private const int ProfileFieldCount = 7;
        private const int RecommendedJobLimit = 5;
        private const int RecentApplicationLimit = 5;
        private const int RecommendedMatchThreshold = 50;

        private readonly IJobSeekerRepository _jobSeekers;
        private readonly IUserRepository _users;
        private readonly IJobRepository _jobs;
        private readonly IApplicationRepository _applications;
        private readonly IApplicationService _applicationService;
        private readonly IContactRequestService _contactRequests;
        private readonly IFileStorageService _fileStorage;
        private readonly IMatchingService _matching;
        private readonly ICacheService _cache;
        private readonly CacheOptions _cacheOptions;
        private readonly ILogger<JobSeekerService> _logger;

        public JobSeekerService(
            IJobSeekerRepository jobSeekers,
            IUserRepository users,
            IJobRepository jobs,
            IApplicationRepository applications,
            IApplicationService applicationService,
            IContactRequestService contactRequests,
            IFileStorageService fileStorage,
            IMatchingService matching,
            ICacheService cache,
            IOptions<CacheOptions> cacheOptions,
            ILogger<JobSeekerService> logger)
        {
            _jobSeekers = jobSeekers;
            _users = users;
            _jobs = jobs;
            _applications = applications;
            _applicationService = applicationService;
            _contactRequests = contactRequests;
            _fileStorage = fileStorage;
            _matching = matching;
            _cache = cache;
            _cacheOptions = cacheOptions.Value;
            _logger = logger;
        }

        public async Task<JobSeekerProfileDto> GetProfileAsync(int userId, CancellationToken cancellationToken = default)
        {
            var profile = await GetProfileOrThrowAsync(userId, cancellationToken);
            return MapProfile(profile);
        }

        public async Task<JobSeekerProfileDto> UpdateProfileAsync(int userId, UpdateJobSeekerProfileDto request, CancellationToken cancellationToken = default)
        {
            var profile = await _jobSeekers.GetTrackedByUserIdAsync(userId, cancellationToken)
                ?? throw new NotFoundException("Job seeker profile was not found.");

            profile.ProfessionalTitle = request.ProfessionalTitle.Trim();
            profile.Location = request.Location.Trim();
            profile.YearsOfExperience = request.YearsOfExperience;
            profile.Education = request.Education.Trim();
            profile.About = request.About?.Trim() ?? string.Empty;
            profile.UpdatedAt = DateTime.UtcNow;

            var desiredSkills = await _jobSeekers.EnsureSkillsAsync(request.Skills, cancellationToken);
            var desiredNames = desiredSkills
                .Select(skill => skill.Name)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var obsoleteLinks = profile.JobSeekerSkills
                .Where(link => link.Skill == null || !desiredNames.Contains(link.Skill.Name))
                .ToList();

            foreach (var link in obsoleteLinks)
            {
                profile.JobSeekerSkills.Remove(link);
            }

            var retainedNames = profile.JobSeekerSkills
                .Where(link => link.Skill != null)
                .Select(link => link.Skill.Name)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            foreach (var skill in desiredSkills.Where(skill => !retainedNames.Contains(skill.Name)))
            {
                profile.JobSeekerSkills.Add(new JobSeekerSkill
                {
                    JobSeekerProfileId = profile.Id,
                    Skill = skill
                });
            }

            await _jobSeekers.SaveChangesAsync(cancellationToken);

            _cache.RemoveMatchCacheForJobSeeker(userId);
            _cache.RemoveDashboardCaches();

            _logger.LogInformation("Updated job seeker profile for user {UserId}.", userId);

            var updated = await GetProfileOrThrowAsync(userId, cancellationToken);
            return MapProfile(updated);
        }

        public async Task<CvDocumentDto> UploadCvAsync(int userId, IFormFile file, CancellationToken cancellationToken = default)
        {
            var profile = await _jobSeekers.GetTrackedByUserIdAsync(userId, cancellationToken)
                ?? throw new NotFoundException("Job seeker profile was not found.");

            var stored = await _fileStorage.SaveCvAsync(file, profile.Id, cancellationToken);

            var existing = await _jobSeekers.GetTrackedCvByProfileIdAsync(profile.Id, cancellationToken);
            if (existing != null)
            {
                var previousPath = existing.RelativeFilePath;
                _jobSeekers.RemoveCv(existing);
                await _jobSeekers.SaveChangesAsync(cancellationToken);
                TryDeleteFile(previousPath);
            }

            var document = new CvDocument
            {
                JobSeekerId = profile.Id,
                OriginalFileName = stored.OriginalFileName,
                StoredFileName = stored.StoredFileName,
                RelativeFilePath = stored.RelativeFilePath,
                ContentType = stored.ContentType,
                FileSize = stored.FileSize,
                UploadedAt = DateTime.UtcNow
            };

            await _jobSeekers.AddCvAsync(document, cancellationToken);
            await _jobSeekers.SaveChangesAsync(cancellationToken);

            _cache.RemoveDashboardCaches();
            _logger.LogInformation("Uploaded CV for user {UserId}.", userId);

            return MapCv(document)!;
        }

        public async Task<CvDocumentDto?> GetCvAsync(int userId, CancellationToken cancellationToken = default)
        {
            var profile = await GetProfileOrThrowAsync(userId, cancellationToken);
            var document = await _jobSeekers.GetCvByProfileIdAsync(profile.Id, cancellationToken);

            return MapCv(document);
        }

        public async Task<FileDownloadDto> DownloadCvAsync(int userId, CancellationToken cancellationToken = default)
        {
            var profile = await GetProfileOrThrowAsync(userId, cancellationToken);

            var document = await _jobSeekers.GetCvByProfileIdAsync(profile.Id, cancellationToken)
                ?? throw new NotFoundException("No CV has been uploaded yet.");

            var content = await _fileStorage.ReadAsync(document.RelativeFilePath, cancellationToken);

            return new FileDownloadDto
            {
                Content = content,
                ContentType = document.ContentType,
                FileName = document.OriginalFileName
            };
        }

        public async Task DeleteCvAsync(int userId, CancellationToken cancellationToken = default)
        {
            var profile = await GetProfileOrThrowAsync(userId, cancellationToken);

            var document = await _jobSeekers.GetTrackedCvByProfileIdAsync(profile.Id, cancellationToken)
                ?? throw new NotFoundException("No CV has been uploaded yet.");

            var path = document.RelativeFilePath;

            _jobSeekers.RemoveCv(document);
            await _jobSeekers.SaveChangesAsync(cancellationToken);

            TryDeleteFile(path);

            _cache.RemoveDashboardCaches();
            _logger.LogInformation("Deleted CV for user {UserId}.", userId);
        }

        public Task<List<ApplicationDto>> GetApplicationsAsync(int userId, CancellationToken cancellationToken = default)
        {
            return _applicationService.GetJobSeekerApplicationsAsync(userId, cancellationToken);
        }

        public Task<List<ContactRequestDto>> GetContactRequestsAsync(int userId, CancellationToken cancellationToken = default)
        {
            return _contactRequests.GetJobSeekerRequestsAsync(userId, cancellationToken);
        }

        public Task<ContactRequestDto> RespondToContactRequestAsync(
            int userId,
            int contactRequestId,
            RespondToContactRequestDto request,
            CancellationToken cancellationToken = default)
        {
            return _contactRequests.RespondAsync(userId, contactRequestId, request, cancellationToken);
        }

        public async Task<JobSeekerDashboardDto> GetDashboardAsync(int userId, CancellationToken cancellationToken = default)
        {
            var cacheKey = CacheKeys.Dashboard(RoleNames.JobSeeker, userId);
            var cached = _cache.Get<JobSeekerDashboardDto>(cacheKey);
            if (cached != null)
            {
                return cached;
            }

            var profile = await GetProfileOrThrowAsync(userId, cancellationToken);
            var openVacancies = await _jobs.GetOpenVacanciesAsync(cancellationToken);
            var appliedVacancyIds = await _applications.GetAppliedVacancyIdsAsync(userId, cancellationToken);
            var applications = await _applications.GetByJobSeekerAsync(userId, cancellationToken);

            var scored = openVacancies
                .Select(vacancy => new
                {
                    Vacancy = vacancy,
                    Match = _matching.Calculate(profile, vacancy)
                })
                .ToList();

            var recommended = scored
                .Where(x => !appliedVacancyIds.Contains(x.Vacancy.Id))
                .Where(x => x.Match.TotalScore >= RecommendedMatchThreshold)
                .OrderByDescending(x => x.Match.TotalScore)
                .ThenByDescending(x => x.Vacancy.CreatedAt)
                .Take(RecommendedJobLimit)
                .Select(x => new RecommendedJobDto
                {
                    Id = x.Vacancy.Id,
                    Title = x.Vacancy.Title,
                    CompanyName = ResolveCompanyName(x.Vacancy),
                    Location = x.Vacancy.Location,
                    MatchScore = x.Match.TotalScore,
                    MissingSkillsCount = x.Match.MissingSkills.Count
                })
                .ToList();

            var dashboard = new JobSeekerDashboardDto
            {
                FullName = profile.User?.FullName ?? string.Empty,
                ProfileCompletionPercent = CalculateCompletion(profile),
                SkillCount = profile.JobSeekerSkills.Count,
                OpenMatchingJobs = scored.Count(x => x.Match.TotalScore >= RecommendedMatchThreshold),
                ApplicationCount = applications.Count,
                BestMatchScore = scored.Count == 0 ? null : scored.Max(x => x.Match.TotalScore),
                RecommendedJobs = recommended,
                RecentApplications = applications
                    .OrderByDescending(a => a.AppliedAt)
                    .Take(RecentApplicationLimit)
                    .Select(a => new RecentApplicationDto
                    {
                        Id = a.Id,
                        JobTitle = a.Vacancy.Title,
                        CompanyName = ResolveCompanyName(a.Vacancy),
                        MatchScore = a.MatchScore,
                        Status = a.Status.ToString(),
                        AppliedAt = a.AppliedAt
                    })
                    .ToList()
            };

            _cache.Set(cacheKey, dashboard, TimeSpan.FromMinutes(_cacheOptions.DashboardMinutes));

            return dashboard;
        }

        private async Task<JobSeekerProfile> GetProfileOrThrowAsync(int userId, CancellationToken cancellationToken)
        {
            var profile = await _jobSeekers.GetByUserIdAsync(userId, cancellationToken);

            if (profile != null)
            {
                return profile;
            }

            var user = await _users.GetByIdAsync(userId, cancellationToken);

            if (user == null)
            {
                throw new NotFoundException("User was not found.");
            }

            if (user.Role != UserRole.JobSeeker)
            {
                throw new ForbiddenException("Only job seekers can access this resource.");
            }

            throw new NotFoundException("Job seeker profile was not found.");
        }

        private void TryDeleteFile(string relativePath)
        {
            try
            {
                _fileStorage.Delete(relativePath);
            }
            catch (IOException exception)
            {
                _logger.LogWarning(exception, "Could not delete stored CV at {Path}.", relativePath);
            }
        }

        private static int CalculateCompletion(JobSeekerProfile profile)
        {
            var completed = 0;

            if (!string.IsNullOrWhiteSpace(profile.ProfessionalTitle)) completed++;
            if (!string.IsNullOrWhiteSpace(profile.Location)) completed++;
            if (!string.IsNullOrWhiteSpace(profile.Education)) completed++;
            if (!string.IsNullOrWhiteSpace(profile.About)) completed++;
            if (profile.YearsOfExperience > 0) completed++;
            if (profile.JobSeekerSkills.Count > 0) completed++;
            if (profile.CvDocument != null) completed++;

            return (int)Math.Round(completed / (double)ProfileFieldCount * 100, MidpointRounding.AwayFromZero);
        }

        private static string ResolveCompanyName(Vacancy vacancy)
        {
            return vacancy.Employer?.EmployerProfile?.CompanyName
                   ?? vacancy.Employer?.FullName
                   ?? string.Empty;
        }

        private static JobSeekerProfileDto MapProfile(JobSeekerProfile profile) => new()
        {
            Id = profile.Id,
            UserId = profile.UserId,
            FullName = profile.User?.FullName ?? string.Empty,
            Email = profile.User?.Email ?? string.Empty,
            ProfessionalTitle = profile.ProfessionalTitle,
            Location = profile.Location,
            YearsOfExperience = profile.YearsOfExperience,
            Education = profile.Education,
            About = profile.About,
            Skills = profile.JobSeekerSkills
                .Where(s => s.Skill != null)
                .Select(s => s.Skill.Name)
                .OrderBy(name => name, StringComparer.OrdinalIgnoreCase)
                .ToList(),
            CvDocument = MapCv(profile.CvDocument)
        };

        private static CvDocumentDto? MapCv(CvDocument? document)
        {
            if (document == null)
            {
                return null;
            }

            return new CvDocumentDto
            {
                Id = document.Id,
                OriginalFileName = document.OriginalFileName,
                ContentType = document.ContentType,
                FileSize = document.FileSize,
                UploadedAt = document.UploadedAt
            };
        }
    }
}
