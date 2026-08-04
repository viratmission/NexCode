using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_team_project.DTOs.Common;
using Smart_team_project.DTOs.Employers;
using Smart_team_project.Helpers;
using Smart_team_project.Interfaces.Services;

namespace Smart_team_project.Controllers
{
    [Route("api/employers")]
    [Authorize(Roles = RoleNames.Employer)]
    public class EmployersController : ApiControllerBase
    {
        private readonly IEmployerService _employerService;

        public EmployersController(IEmployerService employerService)
        {
            _employerService = employerService;
        }

        [HttpGet("profile")]
        [ProducesResponseType(typeof(ApiResponseDto<EmployerProfileDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetProfile(CancellationToken cancellationToken)
        {
            var result = await _employerService.GetProfileAsync(CurrentUserId, cancellationToken);

            return Ok(ApiResponseDto<EmployerProfileDto>.Ok(result));
        }

        [HttpPut("profile")]
        [ProducesResponseType(typeof(ApiResponseDto<EmployerProfileDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> UpdateProfile(
            [FromBody] UpdateEmployerProfileDto request,
            CancellationToken cancellationToken)
        {
            var result = await _employerService.UpdateProfileAsync(CurrentUserId, request, cancellationToken);

            return Ok(ApiResponseDto<EmployerProfileDto>.Ok(result, "Company profile updated successfully."));
        }

        [HttpGet("dashboard")]
        [ProducesResponseType(typeof(ApiResponseDto<EmployerDashboardDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken)
        {
            var result = await _employerService.GetDashboardAsync(CurrentUserId, cancellationToken);

            return Ok(ApiResponseDto<EmployerDashboardDto>.Ok(result));
        }
    }
}
