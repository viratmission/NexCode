using Smart_team_project.Models.Entities;

namespace Smart_team_project.Interfaces.Services
{
    public interface IJwtTokenService
    {
        (string Token, DateTime ExpiresAt) CreateToken(User user);
    }
}
