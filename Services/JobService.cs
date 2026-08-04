using Microsoft.Extensions.Options;
using Smart_team_project.Caching;
using Smart_team_project.DTOs.Common;
using Smart_team_project.DTOs.Jobs;
using Smart_team_project.DTOs.Matching;
using Smart_team_project.Exceptions;
using Smart_team_project.Interfaces.Repositories;
using Smart_team_project.Interfaces.Services;
using Smart_team_project.Models.Entities;
using Smart_team_project.Models.Enums;
using Smart_team_project.Options;

namespace Smart_team_project.Services
{
    public class JobService : IJobService
    {
        private const int MaxPageSize = 50;
        private const int UnpagedFetchSize = 500;

        private readonly IJobRepository _jobs;
        private readonly IJobSeekerRepository _jobSeekers;
        private readonly IApplicationRepository _applications;
        private readonly IContactRequestRepository _contactRequests;
        private readonly IMatchingService _matching;
        private readonly ICacheService _cache;
        private readonly CacheOptions _cacheOptions;
        private readonly ILogger<JobService> _logger;

        public JobService(
            IJobRepository jobs,
            IJobSeekerRepository jobSeekers,
            IApplicationRepository applications,
            IContactRequestRepository contactRequests,
            IMatchingService matching,
            ICacheService cache,
            IOptions<CacheOptions> cacheOptions,
            ILogger<JobService> logger)
        {
            _jobs = jobs;
            _jobSeekers = jobSeekers;
            _applications = applications;
            _contactRequests = contactRequests;
            _matching = matching;
            _cache = cache;
            _cacheOptions = cacheOptions.Value;
            _logger = logger;
        }

        public async Task<PagedResultDto<VacancyListDto>> SearchJobsAsync(
            JobSearchRequestDto request,
            int? jobSeekerUserId,
            CancellationToken cancellationToken = default)
        {
            var pageNumber = NormalizePageNumber(request.PageNumber);
            var pageSize = NormalizePageSize(request.PageSize);

            JobSeekerProfile? profile = null;
            if (jobSeekerUserId.HasValue)
            {
                profile = await _jobSeekers.GetByUserIdAsync(jobSeekerUserId.Value, cancellationToken);
            }

            if (profile == null)
            {
                var cacheKey = CacheKeys.OpenVacancies(
                    request.Search ?? string.Empty,
                    request.Location ?? string.Empty,
                    pageNumber,
                    pageSize);

                var cached = _cache.Get<PagedResultDto<VacancyListDto>>(cacheKey);
                if (cached != null)
                {
                    return cached;
                }

                var (items, totalItems) = await _jobs.SearchAsync(
                    request.Search,
                    request.Location,
                    request.MinimumExperience,
                    VacancyStatus.Open,
                    null,
                    pageNumber,
                    pageSize,
                    cancellationToken);

                var counts = await _jobs.GetApplicantCountsAsync(items.Select(v => v.Id), cancellationToken);

                var result = BuildPagedResult(
                    items.Select(vacancy => MapListItem(vacancy, null, counts)).ToList(),
                    pageNumber,
                    pageSize,
                    totalItems);

                _cache.Set(cacheKey, result, TimeSpan.FromMinutes(_cacheOptions.VacancyMinutes));

                return result;
            }

            var appliedVacancyIds = await _applications.GetAppliedVacancyIdsAsync(jobSeekerUserId!.Value, cancellationToken);

            if (request.MinimumMatch.HasValue)
            {
                var (allItems, _) = await _jobs.SearchAsync(
                    request.Search,
                    request.Location,
                    request.MinimumExperience,
                    VacancyStatus.Open,
                    null,
                    1,
                    UnpagedFetchSize,
                    cancellationToken);

                var matched = allItems
                    .Select(vacancy => new { Vacancy = vacancy, Match = _matching.Calculate(profile, vacancy) })
                    .Where(x => x.Match.TotalScore >= request.MinimumMatch.Value)
                    .OrderByDescending(x => x.Match.TotalScore)
                    .ThenByDescending(x => x.Vacancy.CreatedAt)
                    .ToList();

                var pageItems = matched
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                var pageCounts = await _jobs.GetApplicantCountsAsync(pageItems.Select(x => x.Vacancy.Id), cancellationToken);

                return BuildPagedResult(
                    pageItems.Select(x => MapListItem(x.Vacancy, x.Match, pageCounts, appliedVacancyIds)).ToList(),
                    pageNumber,
                    pageSize,
                    matched.Count);
            }

            var (pagedItems, total) = await _jobs.SearchAsync(
                request.Search,
                request.Location,
                request.MinimumExperience,
                VacancyStatus.Open,
                null,
                pageNumber,
                pageSize,
                cancellationToken);

            var applicantCounts = await _jobs.GetApplicantCountsAsync(pagedItems.Select(v => v.Id), cancellationToken);

            var mapped = pagedItems
                .Select(vacancy => MapListItem(vacancy, _matching.Calculate(profile, vacancy), applicantCounts, appliedVacancyIds))
                .OrderByDescending(item => item.MatchScore)
                .ToList();

            return BuildPagedResult(mapped, pageNumber, pageSize, total);
        }

        public async Task<JobDetailsResponseDto> GetJobDetailsAsync(int vacancyId, int? jobSeekerUserId, CancellationToken cancellationToken = default)
        {
            var vacancy = await GetVacancyOrThrowAsync(vacancyId, cancellationToken);

            MatchResultDto? match = null;
            var alreadyApplied = false;

            if (jobSeekerUserId.HasValue)
            {
                match = await _matching.GetMatchForUserAsync(jobSeekerUserId.Value, vacancyId, cancellationToken);
                alreadyApplied = await _applications.ExistsAsync(vacancyId, jobSeekerUserId.Value, cancellationToken);
            }

            return new JobDetailsResponseDto
            {
                Job = MapDetails(vacancy),
                MatchResult = match,
                AlreadyApplied = alreadyApplied
            };
        }

        public async Task<PagedResultDto<VacancyListDto>> GetEmployerVacanciesAsync(
            int employerUserId,
            JobSearchRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var pageNumber = NormalizePageNumber(request.PageNumber);
            var pageSize = NormalizePageSize(request.PageSize);

            var (items, totalItems) = await _jobs.SearchAsync(
                request.Search,
                request.Location,
                request.MinimumExperience,
                null,
                employerUserId,
                pageNumber,
                pageSize,
                cancellationToken);

            var counts = await _jobs.GetApplicantCountsAsync(items.Select(v => v.Id), cancellationToken);

            return BuildPagedResult(
                items.Select(vacancy => MapListItem(vacancy, null, counts)).ToList(),
                pageNumber,
                pageSize,
                totalItems);
        }

        public async Task<VacancyDetailsDto> GetEmployerVacancyAsync(int employerUserId, int vacancyId, CancellationToken cancellationToken = default)
        {
            var vacancy = await GetVacancyOrThrowAsync(vacancyId, cancellationToken);
            EnsureOwnership(vacancy, employerUserId);

            return MapDetails(vacancy);
        }

        public async Task<VacancyDetailsDto> CreateVacancyAsync(int employerUserId, CreateVacancyDto request, CancellationToken cancellationToken = default)
        {
            if (request.RequiredSkills.Count == 0)
            {
                throw new BadRequestException("At least one required skill is needed.");
            }

            var now = DateTime.UtcNow;

            var vacancy = new Vacancy
            {
                EmployerId = employerUserId,
                Title = request.Title.Trim(),
                Description = request.Description.Trim(),
                Location = request.Location.Trim(),
                RequiredExperience = request.RequiredExperience,
                EducationRequirement = request.EducationRequirement?.Trim() ?? string.Empty,
                Status = VacancyStatus.Open,
                CreatedAt = now,
                UpdatedAt = now
            };

            var skills = await _jobs.EnsureSkillsAsync(request.RequiredSkills, cancellationToken);
            foreach (var skill in skills)
            {
                vacancy.VacancySkills.Add(new VacancySkill { Skill = skill });
            }

            await _jobs.AddAsync(vacancy, cancellationToken);
            await _jobs.SaveChangesAsync(cancellationToken);

            _cache.RemoveVacancyCaches();
            _logger.LogInformation("Employer {EmployerId} created vacancy {VacancyId}.", employerUserId, vacancy.Id);

            var created = await GetVacancyOrThrowAsync(vacancy.Id, cancellationToken);
            return MapDetails(created);
        }

        public async Task<VacancyDetailsDto> UpdateVacancyAsync(
            int employerUserId,
            int vacancyId,
            UpdateVacancyDto request,
            CancellationToken cancellationToken = default)
        {
            if (request.RequiredSkills.Count == 0)
            {
                throw new BadRequestException("At least one required skill is needed.");
            }

            var vacancy = await _jobs.GetTrackedByIdAsync(vacancyId, cancellationToken)
                ?? throw new NotFoundException("Vacancy was not found.");

            EnsureOwnership(vacancy, employerUserId);

            vacancy.Title = request.Title.Trim();
            vacancy.Description = request.Description.Trim();
            vacancy.Location = request.Location.Trim();
            vacancy.RequiredExperience = request.RequiredExperience;
            vacancy.EducationRequirement = request.EducationRequirement?.Trim() ?? string.Empty;
            vacancy.UpdatedAt = DateTime.UtcNow;

            var desiredSkills = await _jobs.EnsureSkillsAsync(request.RequiredSkills, cancellationToken);
            var desiredNames = desiredSkills
                .Select(skill => skill.Name)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var obsoleteLinks = vacancy.VacancySkills
                .Where(link => link.Skill == null || !desiredNames.Contains(link.Skill.Name))
                .ToList();

            foreach (var link in obsoleteLinks)
            {
                vacancy.VacancySkills.Remove(link);
            }

            var retainedNames = vacancy.VacancySkills
                .Where(link => link.Skill != null)
                .Select(link => link.Skill.Name)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            foreach (var skill in desiredSkills.Where(skill => !retainedNames.Contains(skill.Name)))
            {
                vacancy.VacancySkills.Add(new VacancySkill
                {
                    VacancyId = vacancy.Id,
                    Skill = skill
                });
            }

            await _jobs.SaveChangesAsync(cancellationToken);

            _cache.RemoveVacancyCaches();
            _cache.RemoveMatchCacheForVacancy(vacancyId);
            _logger.LogInformation("Employer {EmployerId} updated vacancy {VacancyId}.", employerUserId, vacancyId);

            var updated = await GetVacancyOrThrowAsync(vacancyId, cancellationToken);
            return MapDetails(updated);
        }

        public async Task<VacancyDetailsDto> CloseVacancyAsync(int employerUserId, int vacancyId, CancellationToken cancellationToken = default)
        {
            var vacancy = await _jobs.GetTrackedByIdAsync(vacancyId, cancellationToken)
                ?? throw new NotFoundException("Vacancy was not found.");

            EnsureOwnership(vacancy, employerUserId);

            if (vacancy.Status == VacancyStatus.Closed)
            {
                throw new ConflictException("This vacancy is already closed.");
            }

            vacancy.Status = VacancyStatus.Closed;
            vacancy.ClosedAt = DateTime.UtcNow;
            vacancy.UpdatedAt = DateTime.UtcNow;

            await _jobs.SaveChangesAsync(cancellationToken);

            _cache.RemoveVacancyCaches();
            _cache.RemoveMatchCacheForVacancy(vacancyId);
            _logger.LogInformation("Employer {EmployerId} closed vacancy {VacancyId}.", employerUserId, vacancyId);

            return MapDetails(vacancy);
        }

        public async Task<VacancyDetailsDto> ReopenVacancyAsync(int employerUserId, int vacancyId, CancellationToken cancellationToken = default)
        {
            var vacancy = await _jobs.GetTrackedByIdAsync(vacancyId, cancellationToken)
                ?? throw new NotFoundException("Vacancy was not found.");

            EnsureOwnership(vacancy, employerUserId);

            if (vacancy.Status == VacancyStatus.Open)
            {
                throw new ConflictException("This vacancy is already open.");
            }

            vacancy.Status = VacancyStatus.Open;
            vacancy.ClosedAt = null;
            vacancy.UpdatedAt = DateTime.UtcNow;

            await _jobs.SaveChangesAsync(cancellationToken);

            _cache.RemoveVacancyCaches();
            _cache.RemoveMatchCacheForVacancy(vacancyId);
            _logger.LogInformation("Employer {EmployerId} reopened vacancy {VacancyId}.", employerUserId, vacancyId);

            return MapDetails(vacancy);
        }

        public async Task DeleteVacancyAsync(int employerUserId, int vacancyId, CancellationToken cancellationToken = default)
        {
            var vacancy = await _jobs.GetTrackedByIdAsync(vacancyId, cancellationToken)
                ?? throw new NotFoundException("Vacancy was not found.");

            EnsureOwnership(vacancy, employerUserId);

            if (await _applications.HasApplicationsAsync(vacancyId, cancellationToken))
            {
                throw new ConflictException("This vacancy has applications and cannot be deleted. Close it instead.");
            }

            if (await _contactRequests.HasRequestsForVacancyAsync(vacancyId, cancellationToken))
            {
                throw new ConflictException("This vacancy has contact requests and cannot be deleted. Close it instead.");
            }

            _jobs.Remove(vacancy);
            await _jobs.SaveChangesAsync(cancellationToken);

            _cache.RemoveVacancyCaches();
            _cache.RemoveMatchCacheForVacancy(vacancyId);
            _logger.LogInformation("Employer {EmployerId} deleted vacancy {VacancyId}.", employerUserId, vacancyId);
        }

        private async Task<Vacancy> GetVacancyOrThrowAsync(int vacancyId, CancellationToken cancellationToken)
        {
            return await _jobs.GetByIdAsync(vacancyId, cancellationToken)
                   ?? throw new NotFoundException("Vacancy was not found.");
        }

        private static void EnsureOwnership(Vacancy vacancy, int employerUserId)
        {
            if (vacancy.EmployerId != employerUserId)
            {
                throw new ForbiddenException("You can only manage your own vacancies.");
            }
        }

        private static int NormalizePageNumber(int pageNumber) => pageNumber < 1 ? 1 : pageNumber;

        private static int NormalizePageSize(int pageSize)
        {
            if (pageSize < 1)
            {
                return 10;
            }

            return pageSize > MaxPageSize ? MaxPageSize : pageSize;
        }

        private static PagedResultDto<VacancyListDto> BuildPagedResult(
            List<VacancyListDto> items,
            int pageNumber,
            int pageSize,
            int totalItems)
        {
            return new PagedResultDto<VacancyListDto>
            {
                Items = items,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = pageSize == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize)
            };
        }

        private static VacancyListDto MapListItem(
            Vacancy vacancy,
            MatchResultDto? match,
            IReadOnlyDictionary<int, int> applicantCounts,
            HashSet<int>? appliedVacancyIds = null)
        {
            return new VacancyListDto
            {
                Id = vacancy.Id,
                Title = vacancy.Title,
                CompanyName = ResolveCompanyName(vacancy),
                Location = vacancy.Location,
                RequiredExperience = vacancy.RequiredExperience,
                RequiredSkills = ResolveSkills(vacancy),
                Status = vacancy.Status.ToString(),
                CreatedAt = vacancy.CreatedAt,
                MatchScore = match?.TotalScore,
                MissingSkillsCount = match?.MissingSkills.Count,
                ApplicantCount = applicantCounts.TryGetValue(vacancy.Id, out var count) ? count : 0
            };
        }

        private static VacancyDetailsDto MapDetails(Vacancy vacancy) => new()
        {
            Id = vacancy.Id,
            Title = vacancy.Title,
            CompanyName = ResolveCompanyName(vacancy),
            Location = vacancy.Location,
            Description = vacancy.Description,
            RequiredExperience = vacancy.RequiredExperience,
            EducationRequirement = vacancy.EducationRequirement,
            RequiredSkills = ResolveSkills(vacancy),
            Status = vacancy.Status.ToString(),
            CreatedAt = vacancy.CreatedAt,
            ClosedAt = vacancy.ClosedAt
        };

        private static List<string> ResolveSkills(Vacancy vacancy)
        {
            return vacancy.VacancySkills
                .Where(link => link.Skill != null)
                .Select(link => link.Skill.Name)
                .OrderBy(name => name, StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        private static string ResolveCompanyName(Vacancy vacancy)
        {
            return vacancy.Employer?.EmployerProfile?.CompanyName
                   ?? vacancy.Employer?.FullName
                   ?? string.Empty;
        }
    }
}
