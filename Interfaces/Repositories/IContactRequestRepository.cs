using Smart_team_project.Models.Entities;
using Smart_team_project.Models.Enums;

namespace Smart_team_project.Interfaces.Repositories
{
    public interface IContactRequestRepository
    {
        Task<ContactRequest?> GetByIdAsync(int contactRequestId, CancellationToken cancellationToken = default);

        Task<ContactRequest?> GetTrackedByIdAsync(int contactRequestId, CancellationToken cancellationToken = default);

        Task<List<ContactRequest>> GetByEmployerAsync(int employerUserId, ContactRequestStatus? status, CancellationToken cancellationToken = default);

        Task<List<ContactRequest>> GetByJobSeekerAsync(int jobSeekerUserId, CancellationToken cancellationToken = default);

        Task<bool> ExistsPendingAsync(int employerUserId, int jobSeekerUserId, int vacancyId, CancellationToken cancellationToken = default);

        Task<ContactRequest?> GetPendingAsync(int employerUserId, int jobSeekerUserId, int vacancyId, CancellationToken cancellationToken = default);

        Task<int> CountByEmployerAsync(int employerUserId, ContactRequestStatus? status, CancellationToken cancellationToken = default);

        Task<bool> HasRequestsForVacancyAsync(int vacancyId, CancellationToken cancellationToken = default);

        Task AddAsync(ContactRequest contactRequest, CancellationToken cancellationToken = default);

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
