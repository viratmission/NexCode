using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_team_project.DTOs.Applications;
using Smart_team_project.DTOs.Common;
using Smart_team_project.DTOs.Jobs;
using Smart_team_project.Helpers;
using Smart_team_project.Interfaces.Services;

namespace Smart_team_project.Controllers
{
    [Route("api/jobs")]
    public class JobsController : ApiControllerBase
    {
        private readonly IJobService _jobService;
        private readonly IApplicationService _applicationService;

        public JobsController(IJobService jobService, IApplicationService applicationService)
        {
            _jobService = jobService;
            _applicationService = applicationService;
        }

        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponseDto<PagedResultDto<VacancyListDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> Search([FromQuery] JobSearchRequestDto request, CancellationToken cancellationToken)
        {
            var result = await _jobService.SearchJobsAsync(request, CurrentJobSeekerUserId, cancellationToken);

            return Ok(ApiResponseDto<PagedResultDto<VacancyListDto>>.Ok(result));
        }

        [HttpGet("mine")]
        [Authorize(Roles = RoleNames.Employer)]
        [ProducesResponseType(typeof(ApiResponseDto<PagedResultDto<VacancyListDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMyVacancies([FromQuery] JobSearchRequestDto request, CancellationToken cancellationToken)
        {
            var result = await _jobService.GetEmployerVacanciesAsync(CurrentUserId, request, cancellationToken);

            return Ok(ApiResponseDto<PagedResultDto<VacancyListDto>>.Ok(result));
        }

        [HttpGet("mine/{vacancyId:int}")]
        [Authorize(Roles = RoleNames.Employer)]
        [ProducesResponseType(typeof(ApiResponseDto<VacancyDetailsDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetMyVacancy(int vacancyId, CancellationToken cancellationToken)
        {
            var result = await _jobService.GetEmployerVacancyAsync(CurrentUserId, vacancyId, cancellationToken);

            return Ok(ApiResponseDto<VacancyDetailsDto>.Ok(result));
        }

        [HttpGet("{vacancyId:int}")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponseDto<JobDetailsResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int vacancyId, CancellationToken cancellationToken)
        {
            var result = await _jobService.GetJobDetailsAsync(vacancyId, CurrentJobSeekerUserId, cancellationToken);

            return Ok(ApiResponseDto<JobDetailsResponseDto>.Ok(result));
        }

        [HttpPost]
        [Authorize(Roles = RoleNames.Employer)]
        [ProducesResponseType(typeof(ApiResponseDto<VacancyDetailsDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Create([FromBody] CreateVacancyDto request, CancellationToken cancellationToken)
        {
            var result = await _jobService.CreateVacancyAsync(CurrentUserId, request, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { vacancyId = result.Id },
                ApiResponseDto<VacancyDetailsDto>.Ok(result, "Vacancy created successfully."));
        }

        [HttpPut("{vacancyId:int}")]
        [Authorize(Roles = RoleNames.Employer)]
        [ProducesResponseType(typeof(ApiResponseDto<VacancyDetailsDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> Update(
            int vacancyId,
            [FromBody] UpdateVacancyDto request,
            CancellationToken cancellationToken)
        {
            var result = await _jobService.UpdateVacancyAsync(CurrentUserId, vacancyId, request, cancellationToken);

            return Ok(ApiResponseDto<VacancyDetailsDto>.Ok(result, "Vacancy updated successfully."));
        }

        [HttpPatch("{vacancyId:int}/close")]
        [Authorize(Roles = RoleNames.Employer)]
        [ProducesResponseType(typeof(ApiResponseDto<VacancyDetailsDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Close(int vacancyId, CancellationToken cancellationToken)
        {
            var result = await _jobService.CloseVacancyAsync(CurrentUserId, vacancyId, cancellationToken);

            return Ok(ApiResponseDto<VacancyDetailsDto>.Ok(result, "Vacancy closed successfully."));
        }

        [HttpPatch("{vacancyId:int}/reopen")]
        [Authorize(Roles = RoleNames.Employer)]
        [ProducesResponseType(typeof(ApiResponseDto<VacancyDetailsDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Reopen(int vacancyId, CancellationToken cancellationToken)
        {
            var result = await _jobService.ReopenVacancyAsync(CurrentUserId, vacancyId, cancellationToken);

            return Ok(ApiResponseDto<VacancyDetailsDto>.Ok(result, "Vacancy reopened successfully."));
        }

        [HttpDelete("{vacancyId:int}")]
        [Authorize(Roles = RoleNames.Employer)]
        [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Delete(int vacancyId, CancellationToken cancellationToken)
        {
            await _jobService.DeleteVacancyAsync(CurrentUserId, vacancyId, cancellationToken);

            return Ok(ApiResponseDto<object>.Ok("Vacancy deleted successfully."));
        }

        [HttpPost("{jobId:int}/applications")]
        [Authorize(Roles = RoleNames.JobSeeker)]
        [ProducesResponseType(typeof(ApiResponseDto<ApplicationDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Apply(int jobId, CancellationToken cancellationToken)
        {
            var result = await _applicationService.ApplyAsync(CurrentUserId, jobId, cancellationToken);

            return StatusCode(
                StatusCodes.Status201Created,
                ApiResponseDto<ApplicationDto>.Ok(result, "Application submitted successfully."));
        }

        [HttpGet("{vacancyId:int}/applicants")]
        [Authorize(Roles = RoleNames.Employer)]
        [ProducesResponseType(typeof(ApiResponseDto<List<ApplicantListDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetApplicants(int vacancyId, CancellationToken cancellationToken)
        {
            var result = await _applicationService.GetVacancyApplicantsAsync(CurrentUserId, vacancyId, cancellationToken);

            return Ok(ApiResponseDto<List<ApplicantListDto>>.Ok(result));
        }
    }
}
