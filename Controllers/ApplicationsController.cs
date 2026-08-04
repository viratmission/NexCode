using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_team_project.DTOs.Applications;
using Smart_team_project.DTOs.Common;
using Smart_team_project.Helpers;
using Smart_team_project.Interfaces.Services;

namespace Smart_team_project.Controllers
{
    [Route("api/applications")]
    [Authorize(Roles = RoleNames.Employer)]
    public class ApplicationsController : ApiControllerBase
    {
        private readonly IApplicationService _applicationService;

        public ApplicationsController(IApplicationService applicationService)
        {
            _applicationService = applicationService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponseDto<PagedResultDto<ApplicantListDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetApplicants(
            [FromQuery] int? vacancyId,
            [FromQuery] string? status,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            CancellationToken cancellationToken = default)
        {
            var result = await _applicationService.GetEmployerApplicantsAsync(
                CurrentUserId,
                vacancyId,
                status,
                pageNumber,
                pageSize,
                cancellationToken);

            return Ok(ApiResponseDto<PagedResultDto<ApplicantListDto>>.Ok(result));
        }

        [HttpGet("{applicationId:int}")]
        [ProducesResponseType(typeof(ApiResponseDto<ApplicantDetailsDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetApplicant(int applicationId, CancellationToken cancellationToken)
        {
            var result = await _applicationService.GetApplicantDetailsAsync(CurrentUserId, applicationId, cancellationToken);

            return Ok(ApiResponseDto<ApplicantDetailsDto>.Ok(result));
        }

        [HttpPut("{applicationId:int}/status")]
        [ProducesResponseType(typeof(ApiResponseDto<ApplicantDetailsDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> UpdateStatus(
            int applicationId,
            [FromBody] UpdateApplicationStatusDto request,
            CancellationToken cancellationToken)
        {
            var result = await _applicationService.UpdateStatusAsync(CurrentUserId, applicationId, request, cancellationToken);

            return Ok(ApiResponseDto<ApplicantDetailsDto>.Ok(result, $"Application marked as {result.ApplicationStatus}."));
        }

        [HttpGet("{applicationId:int}/cv")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DownloadCv(int applicationId, CancellationToken cancellationToken)
        {
            var file = await _applicationService.DownloadApplicantCvAsync(CurrentUserId, applicationId, cancellationToken);

            return File(file.Content, file.ContentType, file.FileName);
        }
    }
}
