using Microsoft.EntityFrameworkCore;
using Smart_team_project.Data;
using Smart_team_project.Interfaces.Repositories;
using Smart_team_project.Models.Entities;
using Smart_team_project.Models.Enums;

namespace Smart_team_project.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _context;

        public UserRepository(AppDbContext context)
        {
            _context = context;
        }

        public Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            return _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        }

        public Task<User?> GetTrackedByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            return _context.Users.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        }

        public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
        {
            var normalized = email.Trim().ToLower();

            return _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Email.ToLower() == normalized, cancellationToken);
        }

        public Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default)
        {
            var normalized = email.Trim().ToLower();

            return _context.Users
                .AsNoTracking()
                .AnyAsync(u => u.Email.ToLower() == normalized, cancellationToken);
        }

        public Task<int> CountByRoleAsync(UserRole? role, bool? isActive, CancellationToken cancellationToken = default)
        {
            var query = _context.Users.AsNoTracking();

            if (role.HasValue)
            {
                query = query.Where(u => u.Role == role.Value);
            }

            if (isActive.HasValue)
            {
                query = query.Where(u => u.IsActive == isActive.Value);
            }

            return query.CountAsync(cancellationToken);
        }

        public async Task AddAsync(User user, CancellationToken cancellationToken = default)
        {
            await _context.Users.AddAsync(user, cancellationToken);
        }

        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return _context.SaveChangesAsync(cancellationToken);
        }
    }
}
