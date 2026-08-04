using Smart_team_project.DTOs.Admin;
using Smart_team_project.DTOs.Common;

namespace Smart_team_project.Interfaces.Services
{
    public interface IAdminService
    {
        Task<AdminDashboardDto> GetDashboardAsync(CancellationToken cancellationToken = default);

        Task<PagedResultDto<AdminUserDto>> GetUsersAsync(AdminUserSearchRequestDto request, CancellationToken cancellationToken = default);

        Task<AdminUserDto> GetUserAsync(int userId, CancellationToken cancellationToken = default);

        Task<AdminUserDto> UpdateUserStatusAsync(int userId, UpdateUserStatusDto request, CancellationToken cancellationToken = default);

        Task<ApplicationSettingDto> GetSettingsAsync(CancellationToken cancellationToken = default);

        Task<ApplicationSettingDto> UpdateSettingsAsync(UpdateApplicationSettingDto request, CancellationToken cancellationToken = default);
    }
}
