using Smart_team_project.DTOs.Common;
using Smart_team_project.DTOs.Jobs;

namespace Smart_team_project.Interfaces.Services
{
    public interface IJobService
    {
        Task<PagedResultDto<VacancyListDto>> SearchJobsAsync(JobSearchRequestDto request, int? jobSeekerUserId, CancellationToken cancellationToken = default);

        Task<JobDetailsResponseDto> GetJobDetailsAsync(int vacancyId, int? jobSeekerUserId, CancellationToken cancellationToken = default);

        Task<PagedResultDto<VacancyListDto>> GetEmployerVacanciesAsync(int employerUserId, JobSearchRequestDto request, CancellationToken cancellationToken = default);

        Task<VacancyDetailsDto> GetEmployerVacancyAsync(int employerUserId, int vacancyId, CancellationToken cancellationToken = default);

        Task<VacancyDetailsDto> CreateVacancyAsync(int employerUserId, CreateVacancyDto request, CancellationToken cancellationToken = default);

        Task<VacancyDetailsDto> UpdateVacancyAsync(int employerUserId, int vacancyId, UpdateVacancyDto request, CancellationToken cancellationToken = default);

        Task<VacancyDetailsDto> CloseVacancyAsync(int employerUserId, int vacancyId, CancellationToken cancellationToken = default);

        Task<VacancyDetailsDto> ReopenVacancyAsync(int employerUserId, int vacancyId, CancellationToken cancellationToken = default);

        Task DeleteVacancyAsync(int employerUserId, int vacancyId, CancellationToken cancellationToken = default);
    }
}
