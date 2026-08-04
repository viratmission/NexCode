using Smart_team_project.DTOs.Notifications;
using Smart_team_project.Exceptions;
using Smart_team_project.Interfaces.Repositories;
using Smart_team_project.Interfaces.Services;
using Smart_team_project.Models.Entities;
using Smart_team_project.Models.Enums;

namespace Smart_team_project.Services
{
    public class NotificationService : INotificationService
    {
        private const int MaxNotifications = 50;

        private readonly INotificationRepository _notifications;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(INotificationRepository notifications, ILogger<NotificationService> logger)
        {
            _notifications = notifications;
            _logger = logger;
        }

        public async Task<NotificationListDto> GetForUserAsync(int userId, bool unreadOnly = false, CancellationToken cancellationToken = default)
        {
            var items = await _notifications.GetByUserAsync(userId, unreadOnly, MaxNotifications, cancellationToken);
            var unreadCount = await _notifications.CountUnreadAsync(userId, cancellationToken);

            return new NotificationListDto
            {
                Items = items.Select(Map).ToList(),
                UnreadCount = unreadCount
            };
        }

        public Task<int> GetUnreadCountAsync(int userId, CancellationToken cancellationToken = default)
        {
            return _notifications.CountUnreadAsync(userId, cancellationToken);
        }

        public async Task<NotificationDto> MarkAsReadAsync(int userId, int notificationId, CancellationToken cancellationToken = default)
        {
            var notification = await _notifications.GetTrackedAsync(notificationId, userId, cancellationToken)
                ?? throw new NotFoundException("Notification was not found.");

            if (!notification.IsRead)
            {
                notification.IsRead = true;
                await _notifications.SaveChangesAsync(cancellationToken);
            }

            return Map(notification);
        }

        public async Task<int> MarkAllAsReadAsync(int userId, CancellationToken cancellationToken = default)
        {
            var unread = await _notifications.GetTrackedUnreadAsync(userId, cancellationToken);

            if (unread.Count == 0)
            {
                return 0;
            }

            foreach (var notification in unread)
            {
                notification.IsRead = true;
            }

            await _notifications.SaveChangesAsync(cancellationToken);

            return unread.Count;
        }

        public async Task CreateAsync(int userId, string title, string message, NotificationType type, CancellationToken cancellationToken = default)
        {
            var notification = new Notification
            {
                UserId = userId,
                Title = title,
                Message = message,
                Type = type,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await _notifications.AddAsync(notification, cancellationToken);
            await _notifications.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Created {Type} notification for user {UserId}.", type, userId);
        }

        private static NotificationDto Map(Notification notification) => new()
        {
            Id = notification.Id,
            Title = notification.Title,
            Message = notification.Message,
            Type = notification.Type.ToString(),
            IsRead = notification.IsRead,
            CreatedAt = notification.CreatedAt
        };
    }
}
