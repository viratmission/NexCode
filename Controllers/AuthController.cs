using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_team_project.DTOs.Auth;
using Smart_team_project.DTOs.Common;
using Smart_team_project.Interfaces.Services;

namespace Smart_team_project.Controllers
{
    [Route("api/auth")]
    public class AuthController : ApiControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register/job-seeker")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponseDto<AuthResponseDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> RegisterJobSeeker(
            [FromBody] RegisterJobSeekerDto request,
            CancellationToken cancellationToken)
        {
            var result = await _authService.RegisterJobSeekerAsync(request, cancellationToken);

            return StatusCode(
                StatusCodes.Status201Created,
                ApiResponseDto<AuthResponseDto>.Ok(result, "Job seeker account created successfully."));
        }

        [HttpPost("register/employer")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponseDto<AuthResponseDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> RegisterEmployer(
            [FromBody] RegisterEmployerDto request,
            CancellationToken cancellationToken)
        {
            var result = await _authService.RegisterEmployerAsync(request, cancellationToken);

            return StatusCode(
                StatusCodes.Status201Created,
                ApiResponseDto<AuthResponseDto>.Ok(result, "Employer account created successfully."));
        }

        [HttpPost("login")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponseDto<AuthResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request, CancellationToken cancellationToken)
        {
            var result = await _authService.LoginAsync(request, cancellationToken);

            return Ok(ApiResponseDto<AuthResponseDto>.Ok(result, "Signed in successfully."));
        }

        [HttpGet("me")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponseDto<CurrentUserDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetCurrentUser(CancellationToken cancellationToken)
        {
            var result = await _authService.GetCurrentUserAsync(CurrentUserId, cancellationToken);

            return Ok(ApiResponseDto<CurrentUserDto>.Ok(result));
        }
    }
}
