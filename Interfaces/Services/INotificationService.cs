using Smart_team_project.DTOs.Notifications;
using Smart_team_project.Models.Enums;

namespace Smart_team_project.Interfaces.Services
{
    public interface INotificationService
    {
        Task<NotificationListDto> GetForUserAsync(int userId, bool unreadOnly = false, CancellationToken cancellationToken = default);

        Task<int> GetUnreadCountAsync(int userId, CancellationToken cancellationToken = default);

        Task<NotificationDto> MarkAsReadAsync(int userId, int notificationId, CancellationToken cancellationToken = default);

        Task<int> MarkAllAsReadAsync(int userId, CancellationToken cancellationToken = default);

        Task CreateAsync(int userId, string title, string message, NotificationType type, CancellationToken cancellationToken = default);
    }
}
