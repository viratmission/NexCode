using Smart_team_project.Models.Entities;
using Smart_team_project.Models.Enums;

namespace Smart_team_project.Interfaces.Repositories
{
    public interface IApplicationRepository
    {
        Task<bool> ExistsAsync(int vacancyId, int jobSeekerUserId, CancellationToken cancellationToken = default);

        Task<JobApplication?> GetByIdAsync(int applicationId, CancellationToken cancellationToken = default);

        Task<JobApplication?> GetTrackedByIdAsync(int applicationId, CancellationToken cancellationToken = default);

        Task<List<JobApplication>> GetByJobSeekerAsync(int jobSeekerUserId, CancellationToken cancellationToken = default);

        Task<List<JobApplication>> GetByVacancyAsync(int vacancyId, CancellationToken cancellationToken = default);

        Task<(List<JobApplication> Items, int TotalItems)> GetByEmployerAsync(
            int employerUserId,
            int? vacancyId,
            ApplicationStatus? status,
            int pageNumber,
            int pageSize,
            CancellationToken cancellationToken = default);

        Task<int> CountByEmployerAsync(int employerUserId, ApplicationStatus? status, CancellationToken cancellationToken = default);

        Task<int> CountByJobSeekerAsync(int jobSeekerUserId, CancellationToken cancellationToken = default);

        Task<int> CountAllAsync(CancellationToken cancellationToken = default);

        Task<int?> GetBestMatchScoreAsync(int jobSeekerUserId, CancellationToken cancellationToken = default);

        Task<HashSet<int>> GetAppliedVacancyIdsAsync(int jobSeekerUserId, CancellationToken cancellationToken = default);

        Task<bool> HasApplicationsAsync(int vacancyId, CancellationToken cancellationToken = default);

        Task AddAsync(JobApplication application, CancellationToken cancellationToken = default);

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
