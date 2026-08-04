using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_team_project.DTOs.Admin;
using Smart_team_project.DTOs.Common;
using Smart_team_project.Helpers;
using Smart_team_project.Interfaces.Services;

namespace Smart_team_project.Controllers
{
    [Route("api/admin")]
    [Authorize(Roles = RoleNames.Administrator)]
    public class AdminController : ApiControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        [HttpGet("dashboard")]
        [ProducesResponseType(typeof(ApiResponseDto<AdminDashboardDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken)
        {
            var result = await _adminService.GetDashboardAsync(cancellationToken);

            return Ok(ApiResponseDto<AdminDashboardDto>.Ok(result));
        }

        [HttpGet("users")]
        [ProducesResponseType(typeof(ApiResponseDto<PagedResultDto<AdminUserDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetUsers([FromQuery] AdminUserSearchRequestDto request, CancellationToken cancellationToken)
        {
            var result = await _adminService.GetUsersAsync(request, cancellationToken);

            return Ok(ApiResponseDto<PagedResultDto<AdminUserDto>>.Ok(result));
        }

        [HttpGet("users/{userId:int}")]
        [ProducesResponseType(typeof(ApiResponseDto<AdminUserDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetUser(int userId, CancellationToken cancellationToken)
        {
            var result = await _adminService.GetUserAsync(userId, cancellationToken);

            return Ok(ApiResponseDto<AdminUserDto>.Ok(result));
        }

        [HttpPut("users/{userId:int}/status")]
        [ProducesResponseType(typeof(ApiResponseDto<AdminUserDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> UpdateUserStatus(
            int userId,
            [FromBody] UpdateUserStatusDto request,
            CancellationToken cancellationToken)
        {
            var result = await _adminService.UpdateUserStatusAsync(userId, request, cancellationToken);

            return Ok(ApiResponseDto<AdminUserDto>.Ok(
                result,
                result.IsActive ? "User account enabled." : "User account disabled."));
        }

        [HttpGet("settings")]
        [ProducesResponseType(typeof(ApiResponseDto<ApplicationSettingDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetSettings(CancellationToken cancellationToken)
        {
            var result = await _adminService.GetSettingsAsync(cancellationToken);

            return Ok(ApiResponseDto<ApplicationSettingDto>.Ok(result));
        }

        [HttpPut("settings")]
        [ProducesResponseType(typeof(ApiResponseDto<ApplicationSettingDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> UpdateSettings(
            [FromBody] UpdateApplicationSettingDto request,
            CancellationToken cancellationToken)
        {
            var result = await _adminService.UpdateSettingsAsync(request, cancellationToken);

            return Ok(ApiResponseDto<ApplicationSettingDto>.Ok(result, "Application settings updated successfully."));
        }
    }
}
