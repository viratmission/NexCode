using Smart_team_project.Models.Entities;

namespace Smart_team_project.Interfaces.Repositories
{
    public interface INotificationRepository
    {
        Task<List<Notification>> GetByUserAsync(int userId, bool unreadOnly, int take, CancellationToken cancellationToken = default);

        Task<Notification?> GetTrackedAsync(int notificationId, int userId, CancellationToken cancellationToken = default);

        Task<List<Notification>> GetTrackedUnreadAsync(int userId, CancellationToken cancellationToken = default);

        Task<int> CountUnreadAsync(int userId, CancellationToken cancellationToken = default);

        Task AddAsync(Notification notification, CancellationToken cancellationToken = default);

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
