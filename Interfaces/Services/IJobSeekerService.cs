using Smart_team_project.DTOs.Applications;
using Smart_team_project.DTOs.Common;
using Smart_team_project.DTOs.ContactRequests;
using Smart_team_project.DTOs.JobSeekers;

namespace Smart_team_project.Interfaces.Services
{
    public interface IJobSeekerService
    {
        Task<JobSeekerProfileDto> GetProfileAsync(int userId, CancellationToken cancellationToken = default);

        Task<JobSeekerProfileDto> UpdateProfileAsync(int userId, UpdateJobSeekerProfileDto request, CancellationToken cancellationToken = default);

        Task<CvDocumentDto> UploadCvAsync(int userId, IFormFile file, CancellationToken cancellationToken = default);

        Task<CvDocumentDto?> GetCvAsync(int userId, CancellationToken cancellationToken = default);

        Task<FileDownloadDto> DownloadCvAsync(int userId, CancellationToken cancellationToken = default);

        Task DeleteCvAsync(int userId, CancellationToken cancellationToken = default);

        Task<List<ApplicationDto>> GetApplicationsAsync(int userId, CancellationToken cancellationToken = default);

        Task<List<ContactRequestDto>> GetContactRequestsAsync(int userId, CancellationToken cancellationToken = default);

        Task<ContactRequestDto> RespondToContactRequestAsync(int userId, int contactRequestId, RespondToContactRequestDto request, CancellationToken cancellationToken = default);

        Task<JobSeekerDashboardDto> GetDashboardAsync(int userId, CancellationToken cancellationToken = default);
    }
}
