using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_team_project.DTOs.Common;
using Smart_team_project.DTOs.ContactRequests;
using Smart_team_project.Helpers;
using Smart_team_project.Interfaces.Services;

namespace Smart_team_project.Controllers
{
    [Route("api/contact-requests")]
    [Authorize(Roles = RoleNames.Employer)]
    public class ContactRequestsController : ApiControllerBase
    {
        private readonly IContactRequestService _contactRequestService;

        public ContactRequestsController(IContactRequestService contactRequestService)
        {
            _contactRequestService = contactRequestService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponseDto<List<ContactRequestDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll([FromQuery] string? status, CancellationToken cancellationToken)
        {
            var result = await _contactRequestService.GetEmployerRequestsAsync(CurrentUserId, status, cancellationToken);

            return Ok(ApiResponseDto<List<ContactRequestDto>>.Ok(result));
        }

        [HttpGet("{contactRequestId:int}")]
        [ProducesResponseType(typeof(ApiResponseDto<ContactRequestDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int contactRequestId, CancellationToken cancellationToken)
        {
            var result = await _contactRequestService.GetEmployerRequestAsync(CurrentUserId, contactRequestId, cancellationToken);

            return Ok(ApiResponseDto<ContactRequestDto>.Ok(result));
        }

        [HttpPost("applications/{applicationId:int}")]
        [ProducesResponseType(typeof(ApiResponseDto<ContactRequestDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponseDto<object>), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Create(int applicationId, CancellationToken cancellationToken)
        {
            var result = await _contactRequestService.CreateForApplicationAsync(CurrentUserId, applicationId, cancellationToken);

            return CreatedAtAction(
                nameof(GetById),
                new { contactRequestId = result.Id },
                ApiResponseDto<ContactRequestDto>.Ok(result, "Contact request sent successfully."));
        }
    }
}
