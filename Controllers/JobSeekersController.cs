using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_team_project.DTOs.Applications;
using Smart_team_project.DTOs.Common;
using Smart_team_project.DTOs.ContactRequests;
using Smart_team_project.DTOs.JobSeekers;
using Smart_team_project.Helpers;
using Smart_team_project.Interfaces.Services;

namespace Smart_team_project.Controllers
{
    [Route("api/job-seekers")]
    [Authorize(Roles = RoleNames.JobSeeker)]
    public class JobSeekersController : ApiControllerBase
    {
        private readonly IJobSeekerService _jobSeekerService;

        public JobSeekersController(IJobSeekerService jobSeekerService)
        {
            _jobSeekerService = jobSeekerService;
        }

        [HttpGet("profile")]
        [ProducesResponseType(typeof(ApiResponseDto<JobSeekerProfileDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetProfile(CancellationToken cancellationToken)
        {
            var result = await _jobSeekerService.GetProfileAsync(CurrentUserId, cancellationToken);

            return Ok(ApiResponseDto<JobSeekerProfileDto>.Ok(result));
        }

        [HttpPut("profile")]
        [ProducesResponseType(typeof(ApiResponseDto<JobSeekerProfileDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> UpdateProfile(
            [FromBody] UpdateJobSeekerProfileDto request,
            CancellationToken cancellationToken)
        {
            var result = await _jobSeekerService.UpdateProfileAsync(CurrentUserId, request, cancellationToken);

            return Ok(ApiResponseDto<JobSeekerProfileDto>.Ok(result, "Profile updated successfully."));
        }

        [HttpGet("cv")]
        [ProducesResponseType(typeof(ApiResponseDto<CvDocumentDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetCv(CancellationToken cancellationToken)
        {
            var result = await _jobSeekerService.GetCvAsync(CurrentUserId, cancellationToken);

            if (result == null)
            {
                return Ok(new ApiResponseDto<CvDocumentDto>
                {
                    Success = true,
                    Message = "No CV has been uploaded yet."
                });
            }

            return Ok(ApiResponseDto<CvDocumentDto>.Ok(result));
        }

        [HttpPost("cv")]
        [RequestSizeLimit(10 * 1024 * 1024)]
        [ProducesResponseType(typeof(ApiResponseDto<CvDocumentDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UploadCv(IFormFile file, CancellationToken cancellationToken)
        {
            var result = await _jobSeekerService.UploadCvAsync(CurrentUserId, file, cancellationToken);

            return Ok(ApiResponseDto<CvDocumentDto>.Ok(result, "CV uploaded successfully."));
        }

        [HttpGet("cv/download")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DownloadCv(CancellationToken cancellationToken)
        {
            var file = await _jobSeekerService.DownloadCvAsync(CurrentUserId, cancellationToken);

            return File(file.Content, file.ContentType, file.FileName);
        }

        [HttpDelete("cv")]
        [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status200OK)]
        public async Task<IActionResult> DeleteCv(CancellationToken cancellationToken)
        {
            await _jobSeekerService.DeleteCvAsync(CurrentUserId, cancellationToken);

            return Ok(ApiResponseDto<object>.Ok("CV deleted successfully."));
        }

        [HttpGet("applications")]
        [ProducesResponseType(typeof(ApiResponseDto<List<ApplicationDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetApplications(CancellationToken cancellationToken)
        {
            var result = await _jobSeekerService.GetApplicationsAsync(CurrentUserId, cancellationToken);

            return Ok(ApiResponseDto<List<ApplicationDto>>.Ok(result));
        }

        [HttpGet("contact-requests")]
        [ProducesResponseType(typeof(ApiResponseDto<List<ContactRequestDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetContactRequests(CancellationToken cancellationToken)
        {
            var result = await _jobSeekerService.GetContactRequestsAsync(CurrentUserId, cancellationToken);

            return Ok(ApiResponseDto<List<ContactRequestDto>>.Ok(result));
        }

        [HttpPut("contact-requests/{contactRequestId:int}")]
        [ProducesResponseType(typeof(ApiResponseDto<ContactRequestDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> RespondToContactRequest(
            int contactRequestId,
            [FromBody] RespondToContactRequestDto request,
            CancellationToken cancellationToken)
        {
            var result = await _jobSeekerService.RespondToContactRequestAsync(
                CurrentUserId,
                contactRequestId,
                request,
                cancellationToken);

            return Ok(ApiResponseDto<ContactRequestDto>.Ok(result, $"Contact request {result.Status.ToLowerInvariant()}."));
        }

        [HttpGet("dashboard")]
        [ProducesResponseType(typeof(ApiResponseDto<JobSeekerDashboardDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken)
        {
            var result = await _jobSeekerService.GetDashboardAsync(CurrentUserId, cancellationToken);

            return Ok(ApiResponseDto<JobSeekerDashboardDto>.Ok(result));
        }
    }
}
