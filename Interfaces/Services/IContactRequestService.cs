using Smart_team_project.DTOs.ContactRequests;

namespace Smart_team_project.Interfaces.Services
{
    public interface IContactRequestService
    {
        Task<ContactRequestDto> CreateForApplicationAsync(int employerUserId, int applicationId, CancellationToken cancellationToken = default);

        Task<List<ContactRequestDto>> GetEmployerRequestsAsync(int employerUserId, string? status, CancellationToken cancellationToken = default);

        Task<ContactRequestDto> GetEmployerRequestAsync(int employerUserId, int contactRequestId, CancellationToken cancellationToken = default);

        Task<List<ContactRequestDto>> GetJobSeekerRequestsAsync(int jobSeekerUserId, CancellationToken cancellationToken = default);

        Task<ContactRequestDto> RespondAsync(int jobSeekerUserId, int contactRequestId, RespondToContactRequestDto request, CancellationToken cancellationToken = default);
    }
}
