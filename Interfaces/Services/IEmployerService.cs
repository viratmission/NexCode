using Smart_team_project.DTOs.Employers;

namespace Smart_team_project.Interfaces.Services
{
    public interface IEmployerService
    {
        Task<EmployerProfileDto> GetProfileAsync(int userId, CancellationToken cancellationToken = default);

        Task<EmployerProfileDto> UpdateProfileAsync(int userId, UpdateEmployerProfileDto request, CancellationToken cancellationToken = default);

        Task<EmployerDashboardDto> GetDashboardAsync(int userId, CancellationToken cancellationToken = default);
    }
}
