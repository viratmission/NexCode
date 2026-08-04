using Smart_team_project.Models.Entities;

namespace Smart_team_project.Interfaces.Repositories
{
    public interface IEmployerRepository
    {
        Task<EmployerProfile?> GetByUserIdAsync(int userId, CancellationToken cancellationToken = default);

        Task<EmployerProfile?> GetTrackedByUserIdAsync(int userId, CancellationToken cancellationToken = default);

        Task<Dictionary<int, string>> GetCompanyNamesAsync(IEnumerable<int> userIds, CancellationToken cancellationToken = default);

        Task AddAsync(EmployerProfile profile, CancellationToken cancellationToken = default);

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
