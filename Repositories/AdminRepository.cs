using Microsoft.EntityFrameworkCore;
using Smart_team_project.Data;
using Smart_team_project.Interfaces.Repositories;
using Smart_team_project.Models.Entities;
using Smart_team_project.Models.Enums;

namespace Smart_team_project.Repositories
{
    public class AdminRepository : IAdminRepository
    {
        private readonly AppDbContext _context;

        public AdminRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<(List<User> Items, int TotalItems)> GetUsersAsync(
            string? search,
            UserRole? role,
            bool? isActive,
            int pageNumber,
            int pageSize,
            CancellationToken cancellationToken = default)
        {
            var query = _context.Users
                .AsNoTracking()
                .Include(u => u.JobSeekerProfile)
                .Include(u => u.EmployerProfile)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(u =>
                    EF.Functions.Like(u.FullName, $"%{term}%") ||
                    EF.Functions.Like(u.Email, $"%{term}%"));
            }

            if (role.HasValue)
            {
                query = query.Where(u => u.Role == role.Value);
            }

            if (isActive.HasValue)
            {
                query = query.Where(u => u.IsActive == isActive.Value);
            }

            var totalItems = await query.CountAsync(cancellationToken);

            var items = await query
                .OrderBy(u => u.Role)
                .ThenBy(u => u.FullName)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            return (items, totalItems);
        }

        public Task<User?> GetUserWithProfilesAsync(int userId, CancellationToken cancellationToken = default)
        {
            return _context.Users
                .AsNoTracking()
                .Include(u => u.JobSeekerProfile)
                .Include(u => u.EmployerProfile)
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        }

        public Task<ApplicationSetting?> GetSettingsAsync(CancellationToken cancellationToken = default)
        {
            return _context.ApplicationSettings
                .AsNoTracking()
                .OrderBy(s => s.Id)
                .FirstOrDefaultAsync(cancellationToken);
        }

        public async Task<ApplicationSetting> GetTrackedSettingsAsync(CancellationToken cancellationToken = default)
        {
            var settings = await _context.ApplicationSettings
                .OrderBy(s => s.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (settings == null)
            {
                settings = new ApplicationSetting
                {
                    ApplicationName = "MatchPoint",
                    DefaultPageSize = 10,
                    MaintenanceMessage = string.Empty,
                    UpdatedAt = DateTime.UtcNow
                };

                await _context.ApplicationSettings.AddAsync(settings, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);
            }

            return settings;
        }

        public async Task<(int TotalUsers, int JobSeekers, int Employers, int ActiveUsers, int DisabledUsers)> GetUserStatisticsAsync(
            CancellationToken cancellationToken = default)
        {
            var rows = await _context.Users
                .AsNoTracking()
                .GroupBy(u => new { u.Role, u.IsActive })
                .Select(g => new { g.Key.Role, g.Key.IsActive, Count = g.Count() })
                .ToListAsync(cancellationToken);

            var totalUsers = rows.Sum(r => r.Count);
            var jobSeekers = rows.Where(r => r.Role == UserRole.JobSeeker).Sum(r => r.Count);
            var employers = rows.Where(r => r.Role == UserRole.Employer).Sum(r => r.Count);
            var activeUsers = rows.Where(r => r.IsActive).Sum(r => r.Count);
            var disabledUsers = rows.Where(r => !r.IsActive).Sum(r => r.Count);

            return (totalUsers, jobSeekers, employers, activeUsers, disabledUsers);
        }

        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return _context.SaveChangesAsync(cancellationToken);
        }
    }
}
