using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_team_project.DTOs.Common;
using Smart_team_project.DTOs.Notifications;
using Smart_team_project.Interfaces.Services;

namespace Smart_team_project.Controllers
{
    [Route("api/notifications")]
    [Authorize]
    public class NotificationsController : ApiControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationsController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponseDto<NotificationListDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll([FromQuery] bool unreadOnly = false, CancellationToken cancellationToken = default)
        {
            var result = await _notificationService.GetForUserAsync(CurrentUserId, unreadOnly, cancellationToken);

            return Ok(ApiResponseDto<NotificationListDto>.Ok(result));
        }

        [HttpGet("unread-count")]
        [ProducesResponseType(typeof(ApiResponseDto<int>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetUnreadCount(CancellationToken cancellationToken)
        {
            var result = await _notificationService.GetUnreadCountAsync(CurrentUserId, cancellationToken);

            return Ok(ApiResponseDto<int>.Ok(result));
        }

        [HttpPut("{notificationId:int}/read")]
        [ProducesResponseType(typeof(ApiResponseDto<NotificationDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> MarkAsRead(int notificationId, CancellationToken cancellationToken)
        {
            var result = await _notificationService.MarkAsReadAsync(CurrentUserId, notificationId, cancellationToken);

            return Ok(ApiResponseDto<NotificationDto>.Ok(result, "Notification marked as read."));
        }

        [HttpPut("read-all")]
        [ProducesResponseType(typeof(ApiResponseDto<int>), StatusCodes.Status200OK)]
        public async Task<IActionResult> MarkAllAsRead(CancellationToken cancellationToken)
        {
            var updated = await _notificationService.MarkAllAsReadAsync(CurrentUserId, cancellationToken);

            return Ok(ApiResponseDto<int>.Ok(updated, $"{updated} notification(s) marked as read."));
        }
    }
}
