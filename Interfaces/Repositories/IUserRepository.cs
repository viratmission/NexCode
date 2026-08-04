using Smart_team_project.Models.Entities;
using Smart_team_project.Models.Enums;

namespace Smart_team_project.Interfaces.Repositories
{
    public interface IUserRepository
    {
        Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

        Task<User?> GetTrackedByIdAsync(int id, CancellationToken cancellationToken = default);

        Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

        Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default);

        Task<int> CountByRoleAsync(UserRole? role, bool? isActive, CancellationToken cancellationToken = default);

        Task AddAsync(User user, CancellationToken cancellationToken = default);

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
