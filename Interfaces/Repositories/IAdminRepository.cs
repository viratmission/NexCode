using Smart_team_project.Models.Entities;
using Smart_team_project.Models.Enums;

namespace Smart_team_project.Interfaces.Repositories
{
    public interface IAdminRepository
    {
        Task<(List<User> Items, int TotalItems)> GetUsersAsync(
            string? search,
            UserRole? role,
            bool? isActive,
            int pageNumber,
            int pageSize,
            CancellationToken cancellationToken = default);

        Task<User?> GetUserWithProfilesAsync(int userId, CancellationToken cancellationToken = default);

        Task<ApplicationSetting?> GetSettingsAsync(CancellationToken cancellationToken = default);

        Task<ApplicationSetting> GetTrackedSettingsAsync(CancellationToken cancellationToken = default);

        Task<(int TotalUsers, int JobSeekers, int Employers, int ActiveUsers, int DisabledUsers)> GetUserStatisticsAsync(CancellationToken cancellationToken = default);

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
