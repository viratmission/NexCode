using Smart_team_project.DTOs.Applications;
using Smart_team_project.DTOs.Common;

namespace Smart_team_project.Interfaces.Services
{
    public interface IApplicationService
    {
        Task<ApplicationDto> ApplyAsync(int jobSeekerUserId, int vacancyId, CancellationToken cancellationToken = default);

        Task<List<ApplicationDto>> GetJobSeekerApplicationsAsync(int jobSeekerUserId, CancellationToken cancellationToken = default);

        Task<PagedResultDto<ApplicantListDto>> GetEmployerApplicantsAsync(
            int employerUserId,
            int? vacancyId,
            string? status,
            int pageNumber,
            int pageSize,
            CancellationToken cancellationToken = default);

        Task<List<ApplicantListDto>> GetVacancyApplicantsAsync(int employerUserId, int vacancyId, CancellationToken cancellationToken = default);

        Task<ApplicantDetailsDto> GetApplicantDetailsAsync(int employerUserId, int applicationId, CancellationToken cancellationToken = default);

        Task<ApplicantDetailsDto> UpdateStatusAsync(int employerUserId, int applicationId, UpdateApplicationStatusDto request, CancellationToken cancellationToken = default);

        Task<FileDownloadDto> DownloadApplicantCvAsync(int employerUserId, int applicationId, CancellationToken cancellationToken = default);
    }
}
