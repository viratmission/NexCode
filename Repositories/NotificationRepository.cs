using Microsoft.EntityFrameworkCore;
using Smart_team_project.Data;
using Smart_team_project.Interfaces.Repositories;
using Smart_team_project.Models.Entities;

namespace Smart_team_project.Repositories
{
    public class NotificationRepository : INotificationRepository
    {
        private readonly AppDbContext _context;

        public NotificationRepository(AppDbContext context)
        {
            _context = context;
        }

        public Task<List<Notification>> GetByUserAsync(int userId, bool unreadOnly, int take, CancellationToken cancellationToken = default)
        {
            var query = _context.Notifications
                .AsNoTracking()
                .Where(n => n.UserId == userId);

            if (unreadOnly)
            {
                query = query.Where(n => !n.IsRead);
            }

            return query
                .OrderByDescending(n => n.CreatedAt)
                .ThenByDescending(n => n.Id)
                .Take(take)
                .ToListAsync(cancellationToken);
        }

        public Task<Notification?> GetTrackedAsync(int notificationId, int userId, CancellationToken cancellationToken = default)
        {
            return _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId, cancellationToken);
        }

        public Task<List<Notification>> GetTrackedUnreadAsync(int userId, CancellationToken cancellationToken = default)
        {
            return _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync(cancellationToken);
        }

        public Task<int> CountUnreadAsync(int userId, CancellationToken cancellationToken = default)
        {
            return _context.Notifications
                .AsNoTracking()
                .CountAsync(n => n.UserId == userId && !n.IsRead, cancellationToken);
        }

        public async Task AddAsync(Notification notification, CancellationToken cancellationToken = default)
        {
            await _context.Notifications.AddAsync(notification, cancellationToken);
        }

        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return _context.SaveChangesAsync(cancellationToken);
        }
    }
}
