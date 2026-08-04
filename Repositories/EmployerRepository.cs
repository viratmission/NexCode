using Microsoft.EntityFrameworkCore;
using Smart_team_project.Data;
using Smart_team_project.Interfaces.Repositories;
using Smart_team_project.Models.Entities;

namespace Smart_team_project.Repositories
{
    public class EmployerRepository : IEmployerRepository
    {
        private readonly AppDbContext _context;

        public EmployerRepository(AppDbContext context)
        {
            _context = context;
        }

        public Task<EmployerProfile?> GetByUserIdAsync(int userId, CancellationToken cancellationToken = default)
        {
            return _context.EmployerProfiles
                .AsNoTracking()
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
        }

        public Task<EmployerProfile?> GetTrackedByUserIdAsync(int userId, CancellationToken cancellationToken = default)
        {
            return _context.EmployerProfiles
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
        }

        public async Task<Dictionary<int, string>> GetCompanyNamesAsync(IEnumerable<int> userIds, CancellationToken cancellationToken = default)
        {
            var ids = userIds.Distinct().ToList();

            if (ids.Count == 0)
            {
                return new Dictionary<int, string>();
            }

            var rows = await _context.EmployerProfiles
                .AsNoTracking()
                .Where(p => ids.Contains(p.UserId))
                .Select(p => new { p.UserId, p.CompanyName })
                .ToListAsync(cancellationToken);

            return rows.ToDictionary(r => r.UserId, r => r.CompanyName);
        }

        public async Task AddAsync(EmployerProfile profile, CancellationToken cancellationToken = default)
        {
            await _context.EmployerProfiles.AddAsync(profile, cancellationToken);
        }

        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return _context.SaveChangesAsync(cancellationToken);
        }
    }
}
