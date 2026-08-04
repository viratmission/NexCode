using Microsoft.Extensions.Options;
using Smart_team_project.Caching;
using Smart_team_project.DTOs.Employers;
using Smart_team_project.Exceptions;
using Smart_team_project.Helpers;
using Smart_team_project.Interfaces.Repositories;
using Smart_team_project.Interfaces.Services;
using Smart_team_project.Models.Entities;
using Smart_team_project.Models.Enums;
using Smart_team_project.Options;

namespace Smart_team_project.Services
{
    public class EmployerService : IEmployerService
    {
        private const int RecentApplicantLimit = 5;
        private const int ActiveVacancyLimit = 5;

        private readonly IEmployerRepository _employers;
        private readonly IUserRepository _users;
        private readonly IJobRepository _jobs;
        private readonly IApplicationRepository _applications;
        private readonly IContactRequestRepository _contactRequests;
        private readonly ICacheService _cache;
        private readonly CacheOptions _cacheOptions;
        private readonly ILogger<EmployerService> _logger;

        public EmployerService(
            IEmployerRepository employers,
            IUserRepository users,
            IJobRepository jobs,
            IApplicationRepository applications,
            IContactRequestRepository contactRequests,
            ICacheService cache,
            IOptions<CacheOptions> cacheOptions,
            ILogger<EmployerService> logger)
        {
            _employers = employers;
            _users = users;
            _jobs = jobs;
            _applications = applications;
            _contactRequests = contactRequests;
            _cache = cache;
            _cacheOptions = cacheOptions.Value;
            _logger = logger;
        }

        public async Task<EmployerProfileDto> GetProfileAsync(int userId, CancellationToken cancellationToken = default)
        {
            var profile = await GetProfileOrThrowAsync(userId, cancellationToken);
            return MapProfile(profile);
        }

        public async Task<EmployerProfileDto> UpdateProfileAsync(int userId, UpdateEmployerProfileDto request, CancellationToken cancellationToken = default)
        {
            var profile = await _employers.GetTrackedByUserIdAsync(userId, cancellationToken)
                ?? throw new NotFoundException("Employer profile was not found.");

            profile.CompanyName = request.CompanyName.Trim();
            profile.Industry = request.Industry.Trim();
            profile.Location = request.Location.Trim();
            profile.Description = request.Description?.Trim() ?? string.Empty;
            profile.UpdatedAt = DateTime.UtcNow;

            await _employers.SaveChangesAsync(cancellationToken);

            _cache.RemoveVacancyCaches();
            _logger.LogInformation("Updated employer profile for user {UserId}.", userId);

            return MapProfile(profile);
        }

        public async Task<EmployerDashboardDto> GetDashboardAsync(int userId, CancellationToken cancellationToken = default)
        {
            var cacheKey = CacheKeys.Dashboard(RoleNames.Employer, userId);
            var cached = _cache.Get<EmployerDashboardDto>(cacheKey);
            if (cached != null)
            {
                return cached;
            }

            var profile = await GetProfileOrThrowAsync(userId, cancellationToken);

            var openVacancies = await _jobs.CountAsync(VacancyStatus.Open, userId, cancellationToken);
            var closedVacancies = await _jobs.CountAsync(VacancyStatus.Closed, userId, cancellationToken);
            var totalApplications = await _applications.CountByEmployerAsync(userId, null, cancellationToken);
            var underReview = await _applications.CountByEmployerAsync(userId, ApplicationStatus.UnderReview, cancellationToken);
            var shortlisted = await _applications.CountByEmployerAsync(userId, ApplicationStatus.Shortlisted, cancellationToken);
            var contactRequestCount = await _contactRequests.CountByEmployerAsync(userId, null, cancellationToken);

            var recentApplications = await _applications.GetByEmployerAsync(userId, null, null, 1, RecentApplicantLimit, cancellationToken);
            var activeVacancies = await _jobs.GetByEmployerAsync(userId, VacancyStatus.Open, cancellationToken);
            var applicantCounts = await _jobs.GetApplicantCountsAsync(activeVacancies.Select(v => v.Id), cancellationToken);

            var dashboard = new EmployerDashboardDto
            {
                CompanyName = profile.CompanyName,
                OpenVacancies = openVacancies,
                ClosedVacancies = closedVacancies,
                TotalApplications = totalApplications,
                UnderReview = underReview,
                Shortlisted = shortlisted,
                ContactRequests = contactRequestCount,
                RecentApplicants = recentApplications.Items
                    .OrderByDescending(a => a.AppliedAt)
                    .Select(a => new RecentApplicantDto
                    {
                        ApplicationId = a.Id,
                        CandidateName = a.JobSeeker?.FullName ?? string.Empty,
                        JobTitle = a.Vacancy.Title,
                        MatchScore = a.MatchScore,
                        Status = a.Status.ToString(),
                        AppliedAt = a.AppliedAt
                    })
                    .ToList(),
                ActiveVacancies = activeVacancies
                    .Take(ActiveVacancyLimit)
                    .Select(v => new ActiveVacancyDto
                    {
                        Id = v.Id,
                        Title = v.Title,
                        Location = v.Location,
                        ApplicantCount = applicantCounts.TryGetValue(v.Id, out var count) ? count : 0,
                        CreatedAt = v.CreatedAt
                    })
                    .ToList()
            };

            _cache.Set(cacheKey, dashboard, TimeSpan.FromMinutes(_cacheOptions.DashboardMinutes));

            return dashboard;
        }

        private async Task<EmployerProfile> GetProfileOrThrowAsync(int userId, CancellationToken cancellationToken)
        {
            var profile = await _employers.GetByUserIdAsync(userId, cancellationToken);

            if (profile != null)
            {
                return profile;
            }

            var user = await _users.GetByIdAsync(userId, cancellationToken);

            if (user == null)
            {
                throw new NotFoundException("User was not found.");
            }

            if (user.Role != UserRole.Employer)
            {
                throw new ForbiddenException("Only employers can access this resource.");
            }

            throw new NotFoundException("Employer profile was not found.");
        }

        private static EmployerProfileDto MapProfile(EmployerProfile profile) => new()
        {
            Id = profile.Id,
            UserId = profile.UserId,
            FullName = profile.User?.FullName ?? string.Empty,
            Email = profile.User?.Email ?? string.Empty,
            CompanyName = profile.CompanyName,
            Industry = profile.Industry,
            Location = profile.Location,
            Description = profile.Description
        };
    }
}
