using Smart_team_project.DTOs.Applications;
using Smart_team_project.DTOs.Common;
using Smart_team_project.DTOs.JobSeekers;
using Smart_team_project.DTOs.Matching;
using Smart_team_project.Exceptions;
using Smart_team_project.Interfaces.Repositories;
using Smart_team_project.Interfaces.Services;
using Smart_team_project.Models.Entities;
using Smart_team_project.Models.Enums;

namespace Smart_team_project.Services
{
    public class ApplicationService : IApplicationService
    {
        private const int MaxPageSize = 50;

        private readonly IApplicationRepository _applications;
        private readonly IJobRepository _jobs;
        private readonly IJobSeekerRepository _jobSeekers;
        private readonly IContactRequestRepository _contactRequests;
        private readonly IMatchingService _matching;
        private readonly INotificationService _notifications;
        private readonly IFileStorageService _fileStorage;
        private readonly ICacheService _cache;
        private readonly ILogger<ApplicationService> _logger;

        public ApplicationService(
            IApplicationRepository applications,
            IJobRepository jobs,
            IJobSeekerRepository jobSeekers,
            IContactRequestRepository contactRequests,
            IMatchingService matching,
            INotificationService notifications,
            IFileStorageService fileStorage,
            ICacheService cache,
            ILogger<ApplicationService> logger)
        {
            _applications = applications;
            _jobs = jobs;
            _jobSeekers = jobSeekers;
            _contactRequests = contactRequests;
            _matching = matching;
            _notifications = notifications;
            _fileStorage = fileStorage;
            _cache = cache;
            _logger = logger;
        }

        public async Task<ApplicationDto> ApplyAsync(int jobSeekerUserId, int vacancyId, CancellationToken cancellationToken = default)
        {
            var vacancy = await _jobs.GetByIdAsync(vacancyId, cancellationToken)
                ?? throw new NotFoundException("Vacancy was not found.");

            if (vacancy.Status != VacancyStatus.Open)
            {
                throw new ConflictException("This vacancy is closed and no longer accepting applications.");
            }

            var profile = await _jobSeekers.GetByUserIdAsync(jobSeekerUserId, cancellationToken)
                ?? throw new NotFoundException("Job seeker profile was not found.");

            if (string.IsNullOrWhiteSpace(profile.ProfessionalTitle) || profile.JobSeekerSkills.Count == 0)
            {
                throw new BadRequestException("Complete your profile with a professional title and at least one skill before applying.");
            }

            if (await _applications.ExistsAsync(vacancyId, jobSeekerUserId, cancellationToken))
            {
                throw new ConflictException("You have already applied to this vacancy.");
            }

            var match = _matching.Calculate(profile, vacancy);
            var now = DateTime.UtcNow;

            var application = new JobApplication
            {
                VacancyId = vacancyId,
                JobSeekerId = jobSeekerUserId,
                MatchScore = match.TotalScore,
                Status = ApplicationStatus.Applied,
                AppliedAt = now,
                UpdatedAt = now
            };

            await _applications.AddAsync(application, cancellationToken);
            await _applications.SaveChangesAsync(cancellationToken);

            await _notifications.CreateAsync(
                vacancy.EmployerId,
                "New application received",
                $"{profile.User?.FullName ?? "A candidate"} applied for \"{vacancy.Title}\" with a {match.TotalScore}% match.",
                NotificationType.ApplicationStatusChanged,
                cancellationToken);

            _cache.RemoveDashboardCaches();
            _cache.RemoveVacancyCaches();

            _logger.LogInformation(
                "User {UserId} applied to vacancy {VacancyId} with match {MatchScore}.",
                jobSeekerUserId,
                vacancyId,
                match.TotalScore);

            return new ApplicationDto
            {
                Id = application.Id,
                VacancyId = vacancy.Id,
                JobTitle = vacancy.Title,
                CompanyName = ResolveCompanyName(vacancy),
                Location = vacancy.Location,
                MatchScore = application.MatchScore,
                Status = application.Status.ToString(),
                AppliedAt = application.AppliedAt,
                UpdatedAt = application.UpdatedAt
            };
        }

        public async Task<List<ApplicationDto>> GetJobSeekerApplicationsAsync(int jobSeekerUserId, CancellationToken cancellationToken = default)
        {
            var applications = await _applications.GetByJobSeekerAsync(jobSeekerUserId, cancellationToken);

            return applications.Select(MapApplication).ToList();
        }

        public async Task<PagedResultDto<ApplicantListDto>> GetEmployerApplicantsAsync(
            int employerUserId,
            int? vacancyId,
            string? status,
            int pageNumber,
            int pageSize,
            CancellationToken cancellationToken = default)
        {
            var normalizedPage = pageNumber < 1 ? 1 : pageNumber;
            var normalizedSize = pageSize < 1 ? 10 : Math.Min(pageSize, MaxPageSize);
            var parsedStatus = ParseStatus(status);

            if (vacancyId.HasValue)
            {
                var vacancy = await _jobs.GetByIdAsync(vacancyId.Value, cancellationToken)
                    ?? throw new NotFoundException("Vacancy was not found.");

                EnsureOwnership(vacancy, employerUserId);
            }

            var (items, totalItems) = await _applications.GetByEmployerAsync(
                employerUserId,
                vacancyId,
                parsedStatus,
                normalizedPage,
                normalizedSize,
                cancellationToken);

            var startRank = (normalizedPage - 1) * normalizedSize + 1;

            return new PagedResultDto<ApplicantListDto>
            {
                Items = items.Select((application, index) => MapApplicant(application, startRank + index)).ToList(),
                PageNumber = normalizedPage,
                PageSize = normalizedSize,
                TotalItems = totalItems,
                TotalPages = (int)Math.Ceiling(totalItems / (double)normalizedSize)
            };
        }

        public async Task<List<ApplicantListDto>> GetVacancyApplicantsAsync(int employerUserId, int vacancyId, CancellationToken cancellationToken = default)
        {
            var vacancy = await _jobs.GetByIdAsync(vacancyId, cancellationToken)
                ?? throw new NotFoundException("Vacancy was not found.");

            EnsureOwnership(vacancy, employerUserId);

            var applications = await _applications.GetByVacancyAsync(vacancyId, cancellationToken);

            return applications
                .Select((application, index) => MapApplicant(application, index + 1))
                .ToList();
        }

        public async Task<ApplicantDetailsDto> GetApplicantDetailsAsync(int employerUserId, int applicationId, CancellationToken cancellationToken = default)
        {
            var application = await _applications.GetByIdAsync(applicationId, cancellationToken)
                ?? throw new NotFoundException("Application was not found.");

            EnsureOwnership(application.Vacancy, employerUserId);

            var contactRequestPending = await _contactRequests.ExistsPendingAsync(
                employerUserId,
                application.JobSeekerId,
                application.VacancyId,
                cancellationToken);

            return MapApplicantDetails(application, contactRequestPending);
        }

        public async Task<ApplicantDetailsDto> UpdateStatusAsync(
            int employerUserId,
            int applicationId,
            UpdateApplicationStatusDto request,
            CancellationToken cancellationToken = default)
        {
            var status = ParseStatus(request.Status)
                ?? throw new BadRequestException(
                    $"Status must be one of: {string.Join(", ", Enum.GetNames<ApplicationStatus>())}.");

            var application = await _applications.GetTrackedByIdAsync(applicationId, cancellationToken)
                ?? throw new NotFoundException("Application was not found.");

            EnsureOwnership(application.Vacancy, employerUserId);

            if (application.Status == status)
            {
                throw new ConflictException($"This application is already marked as {status}.");
            }

            application.Status = status;
            application.UpdatedAt = DateTime.UtcNow;

            await _applications.SaveChangesAsync(cancellationToken);

            await _notifications.CreateAsync(
                application.JobSeekerId,
                "Application status updated",
                $"Your application for \"{application.Vacancy.Title}\" is now {status}.",
                NotificationType.ApplicationStatusChanged,
                cancellationToken);

            _cache.RemoveDashboardCaches();

            _logger.LogInformation(
                "Employer {EmployerId} set application {ApplicationId} to {Status}.",
                employerUserId,
                applicationId,
                status);

            var refreshed = await _applications.GetByIdAsync(applicationId, cancellationToken)
                ?? throw new NotFoundException("Application was not found.");

            var contactRequestPending = await _contactRequests.ExistsPendingAsync(
                employerUserId,
                refreshed.JobSeekerId,
                refreshed.VacancyId,
                cancellationToken);

            return MapApplicantDetails(refreshed, contactRequestPending);
        }

        public async Task<FileDownloadDto> DownloadApplicantCvAsync(int employerUserId, int applicationId, CancellationToken cancellationToken = default)
        {
            var application = await _applications.GetByIdAsync(applicationId, cancellationToken)
                ?? throw new NotFoundException("Application was not found.");

            EnsureOwnership(application.Vacancy, employerUserId);

            var document = application.JobSeeker?.JobSeekerProfile?.CvDocument
                ?? throw new NotFoundException("This candidate has not uploaded a CV.");

            var content = await _fileStorage.ReadAsync(document.RelativeFilePath, cancellationToken);

            return new FileDownloadDto
            {
                Content = content,
                ContentType = document.ContentType,
                FileName = document.OriginalFileName
            };
        }

        private static void EnsureOwnership(Vacancy vacancy, int employerUserId)
        {
            if (vacancy.EmployerId != employerUserId)
            {
                throw new ForbiddenException("You can only manage applications for your own vacancies.");
            }
        }

        private static ApplicationStatus? ParseStatus(string? status)
        {
            if (string.IsNullOrWhiteSpace(status))
            {
                return null;
            }

            return Enum.TryParse<ApplicationStatus>(status.Trim(), true, out var parsed) ? parsed : null;
        }

        private static ApplicationDto MapApplication(JobApplication application) => new()
        {
            Id = application.Id,
            VacancyId = application.VacancyId,
            JobTitle = application.Vacancy.Title,
            CompanyName = ResolveCompanyName(application.Vacancy),
            Location = application.Vacancy.Location,
            MatchScore = application.MatchScore,
            Status = application.Status.ToString(),
            AppliedAt = application.AppliedAt,
            UpdatedAt = application.UpdatedAt
        };

        private ApplicantListDto MapApplicant(JobApplication application, int rank)
        {
            var profile = application.JobSeeker?.JobSeekerProfile;
            var match = BuildMatch(application);

            return new ApplicantListDto
            {
                Rank = rank,
                ApplicationId = application.Id,
                CandidateId = application.JobSeekerId,
                CandidateName = application.JobSeeker?.FullName ?? string.Empty,
                ProfessionalTitle = profile?.ProfessionalTitle ?? string.Empty,
                Experience = profile?.YearsOfExperience ?? 0,
                Education = profile?.Education ?? string.Empty,
                Location = profile?.Location ?? string.Empty,
                MatchScore = application.MatchScore,
                ApplicationStatus = application.Status.ToString(),
                AppliedAt = application.AppliedAt,
                MatchedSkills = match.MatchedSkills,
                MissingSkills = match.MissingSkills,
                VacancyId = application.VacancyId,
                JobTitle = application.Vacancy.Title
            };
        }

        private ApplicantDetailsDto MapApplicantDetails(JobApplication application, bool contactRequestPending)
        {
            var profile = application.JobSeeker?.JobSeekerProfile;
            var match = BuildMatch(application);
            var document = profile?.CvDocument;

            return new ApplicantDetailsDto
            {
                ApplicationId = application.Id,
                CandidateId = application.JobSeekerId,
                CandidateName = application.JobSeeker?.FullName ?? string.Empty,
                Email = application.JobSeeker?.Email ?? string.Empty,
                ProfessionalTitle = profile?.ProfessionalTitle ?? string.Empty,
                Location = profile?.Location ?? string.Empty,
                Experience = profile?.YearsOfExperience ?? 0,
                Education = profile?.Education ?? string.Empty,
                About = profile?.About ?? string.Empty,
                Skills = profile?.JobSeekerSkills
                    .Where(link => link.Skill != null)
                    .Select(link => link.Skill.Name)
                    .OrderBy(name => name, StringComparer.OrdinalIgnoreCase)
                    .ToList() ?? new List<string>(),
                MatchScore = application.MatchScore,
                MatchBreakdown = match,
                ApplicationStatus = application.Status.ToString(),
                AppliedAt = application.AppliedAt,
                VacancyId = application.VacancyId,
                JobTitle = application.Vacancy.Title,
                HasCv = document != null,
                ContactRequestPending = contactRequestPending,
                CvDocument = document == null
                    ? null
                    : new CvDocumentDto
                    {
                        Id = document.Id,
                        OriginalFileName = document.OriginalFileName,
                        ContentType = document.ContentType,
                        FileSize = document.FileSize,
                        UploadedAt = document.UploadedAt
                    }
            };
        }

        private MatchResultDto BuildMatch(JobApplication application)
        {
            var profile = application.JobSeeker?.JobSeekerProfile;

            if (profile == null)
            {
                return new MatchResultDto
                {
                    TotalScore = application.MatchScore,
                    MissingSkills = application.Vacancy.VacancySkills
                        .Where(link => link.Skill != null)
                        .Select(link => link.Skill.Name)
                        .ToList()
                };
            }

            return _matching.Calculate(profile, application.Vacancy);
        }

        private static string ResolveCompanyName(Vacancy vacancy)
        {
            return vacancy.Employer?.EmployerProfile?.CompanyName
                   ?? vacancy.Employer?.FullName
                   ?? string.Empty;
        }
    }
}
