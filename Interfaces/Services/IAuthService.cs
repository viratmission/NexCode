using Smart_team_project.DTOs.Auth;

namespace Smart_team_project.Interfaces.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterJobSeekerAsync(RegisterJobSeekerDto request, CancellationToken cancellationToken = default);

        Task<AuthResponseDto> RegisterEmployerAsync(RegisterEmployerDto request, CancellationToken cancellationToken = default);

        Task<AuthResponseDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default);

        Task<CurrentUserDto> GetCurrentUserAsync(int userId, CancellationToken cancellationToken = default);
    }
}
