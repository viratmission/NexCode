using Smart_team_project.DTOs.ContactRequests;
using Smart_team_project.Exceptions;
using Smart_team_project.Interfaces.Repositories;
using Smart_team_project.Interfaces.Services;
using Smart_team_project.Models.Entities;
using Smart_team_project.Models.Enums;

namespace Smart_team_project.Services
{
    public class ContactRequestService : IContactRequestService
    {
        private readonly IContactRequestRepository _contactRequests;
        private readonly IApplicationRepository _applications;
        private readonly INotificationService _notifications;
        private readonly ICacheService _cache;
        private readonly ILogger<ContactRequestService> _logger;

        public ContactRequestService(
            IContactRequestRepository contactRequests,
            IApplicationRepository applications,
            INotificationService notifications,
            ICacheService cache,
            ILogger<ContactRequestService> logger)
        {
            _contactRequests = contactRequests;
            _applications = applications;
            _notifications = notifications;
            _cache = cache;
            _logger = logger;
        }

        public async Task<ContactRequestDto> CreateForApplicationAsync(int employerUserId, int applicationId, CancellationToken cancellationToken = default)
        {
            var application = await _applications.GetByIdAsync(applicationId, cancellationToken)
                ?? throw new NotFoundException("Application was not found.");

            if (application.Vacancy.EmployerId != employerUserId)
            {
                throw new ForbiddenException("You can only contact candidates who applied to your own vacancies.");
            }

            if (await _contactRequests.ExistsPendingAsync(employerUserId, application.JobSeekerId, application.VacancyId, cancellationToken))
            {
                throw new ConflictException("A pending contact request already exists for this candidate and vacancy.");
            }

            var contactRequest = new ContactRequest
            {
                EmployerId = employerUserId,
                JobSeekerId = application.JobSeekerId,
                VacancyId = application.VacancyId,
                Status = ContactRequestStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _contactRequests.AddAsync(contactRequest, cancellationToken);
            await _contactRequests.SaveChangesAsync(cancellationToken);

            var companyName = application.Vacancy.Employer?.EmployerProfile?.CompanyName
                              ?? application.Vacancy.Employer?.FullName
                              ?? "An employer";

            await _notifications.CreateAsync(
                application.JobSeekerId,
                "New contact request",
                $"{companyName} would like to contact you about \"{application.Vacancy.Title}\".",
                NotificationType.ContactRequest,
                cancellationToken);

            _cache.RemoveDashboardCaches();

            _logger.LogInformation(
                "Employer {EmployerId} created contact request {ContactRequestId} for job seeker {JobSeekerId}.",
                employerUserId,
                contactRequest.Id,
                application.JobSeekerId);

            var created = await _contactRequests.GetByIdAsync(contactRequest.Id, cancellationToken)
                ?? throw new NotFoundException("Contact request was not found.");

            return Map(created);
        }

        public async Task<List<ContactRequestDto>> GetEmployerRequestsAsync(int employerUserId, string? status, CancellationToken cancellationToken = default)
        {
            var parsedStatus = ParseStatus(status);
            var requests = await _contactRequests.GetByEmployerAsync(employerUserId, parsedStatus, cancellationToken);

            return requests.Select(Map).ToList();
        }

        public async Task<ContactRequestDto> GetEmployerRequestAsync(int employerUserId, int contactRequestId, CancellationToken cancellationToken = default)
        {
            var request = await _contactRequests.GetByIdAsync(contactRequestId, cancellationToken)
                ?? throw new NotFoundException("Contact request was not found.");

            if (request.EmployerId != employerUserId)
            {
                throw new ForbiddenException("You can only view your own contact requests.");
            }

            return Map(request);
        }

        public async Task<List<ContactRequestDto>> GetJobSeekerRequestsAsync(int jobSeekerUserId, CancellationToken cancellationToken = default)
        {
            var requests = await _contactRequests.GetByJobSeekerAsync(jobSeekerUserId, cancellationToken);

            return requests.Select(Map).ToList();
        }

        public async Task<ContactRequestDto> RespondAsync(
            int jobSeekerUserId,
            int contactRequestId,
            RespondToContactRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var status = ParseStatus(request.Status)
                ?? throw new BadRequestException("Status must be either Accepted or Declined.");

            if (status == ContactRequestStatus.Pending)
            {
                throw new BadRequestException("Status must be either Accepted or Declined.");
            }

            var contactRequest = await _contactRequests.GetTrackedByIdAsync(contactRequestId, cancellationToken)
                ?? throw new NotFoundException("Contact request was not found.");

            if (contactRequest.JobSeekerId != jobSeekerUserId)
            {
                throw new ForbiddenException("You can only respond to your own contact requests.");
            }

            if (contactRequest.Status != ContactRequestStatus.Pending)
            {
                throw new ConflictException($"This contact request has already been {contactRequest.Status}.");
            }

            contactRequest.Status = status;
            contactRequest.RespondedAt = DateTime.UtcNow;

            await _contactRequests.SaveChangesAsync(cancellationToken);

            var jobSeekerName = contactRequest.JobSeeker?.FullName ?? "A candidate";

            await _notifications.CreateAsync(
                contactRequest.EmployerId,
                "Contact request answered",
                $"{jobSeekerName} {status.ToString().ToLowerInvariant()} your contact request for \"{contactRequest.Vacancy.Title}\".",
                NotificationType.ContactRequest,
                cancellationToken);

            _cache.RemoveDashboardCaches();

            _logger.LogInformation(
                "Job seeker {JobSeekerId} responded {Status} to contact request {ContactRequestId}.",
                jobSeekerUserId,
                status,
                contactRequestId);

            var refreshed = await _contactRequests.GetByIdAsync(contactRequestId, cancellationToken)
                ?? throw new NotFoundException("Contact request was not found.");

            return Map(refreshed);
        }

        private static ContactRequestStatus? ParseStatus(string? status)
        {
            if (string.IsNullOrWhiteSpace(status))
            {
                return null;
            }

            return Enum.TryParse<ContactRequestStatus>(status.Trim(), true, out var parsed) ? parsed : null;
        }

        private static ContactRequestDto Map(ContactRequest request) => new()
        {
            Id = request.Id,
            EmployerId = request.EmployerId,
            EmployerName = request.Employer?.FullName ?? string.Empty,
            CompanyName = request.Employer?.EmployerProfile?.CompanyName ?? string.Empty,
            JobSeekerId = request.JobSeekerId,
            JobSeekerName = request.JobSeeker?.FullName ?? string.Empty,
            VacancyId = request.VacancyId,
            VacancyTitle = request.Vacancy?.Title ?? string.Empty,
            Status = request.Status.ToString(),
            CreatedAt = request.CreatedAt,
            RespondedAt = request.RespondedAt
        };
    }
}
