using Microsoft.EntityFrameworkCore;
using Smart_team_project.Data;
using Smart_team_project.Interfaces.Repositories;
using Smart_team_project.Models.Entities;
using Smart_team_project.Models.Enums;

namespace Smart_team_project.Repositories
{
    public class ContactRequestRepository : IContactRequestRepository
    {
        private readonly AppDbContext _context;

        public ContactRequestRepository(AppDbContext context)
        {
            _context = context;
        }

        public Task<ContactRequest?> GetByIdAsync(int contactRequestId, CancellationToken cancellationToken = default)
        {
            return BuildReadQuery().FirstOrDefaultAsync(c => c.Id == contactRequestId, cancellationToken);
        }

        public Task<ContactRequest?> GetTrackedByIdAsync(int contactRequestId, CancellationToken cancellationToken = default)
        {
            return _context.ContactRequests
                .Include(c => c.Employer)
                    .ThenInclude(u => u.EmployerProfile)
                .Include(c => c.JobSeeker)
                .Include(c => c.Vacancy)
                .FirstOrDefaultAsync(c => c.Id == contactRequestId, cancellationToken);
        }

        public Task<List<ContactRequest>> GetByEmployerAsync(int employerUserId, ContactRequestStatus? status, CancellationToken cancellationToken = default)
        {
            var query = BuildReadQuery().Where(c => c.EmployerId == employerUserId);

            if (status.HasValue)
            {
                query = query.Where(c => c.Status == status.Value);
            }

            return query
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync(cancellationToken);
        }

        public Task<List<ContactRequest>> GetByJobSeekerAsync(int jobSeekerUserId, CancellationToken cancellationToken = default)
        {
            return BuildReadQuery()
                .Where(c => c.JobSeekerId == jobSeekerUserId)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync(cancellationToken);
        }

        public Task<bool> ExistsPendingAsync(int employerUserId, int jobSeekerUserId, int vacancyId, CancellationToken cancellationToken = default)
        {
            return _context.ContactRequests
                .AsNoTracking()
                .AnyAsync(
                    c => c.EmployerId == employerUserId
                         && c.JobSeekerId == jobSeekerUserId
                         && c.VacancyId == vacancyId
                         && c.Status == ContactRequestStatus.Pending,
                    cancellationToken);
        }

        public Task<ContactRequest?> GetPendingAsync(int employerUserId, int jobSeekerUserId, int vacancyId, CancellationToken cancellationToken = default)
        {
            return BuildReadQuery()
                .FirstOrDefaultAsync(
                    c => c.EmployerId == employerUserId
                         && c.JobSeekerId == jobSeekerUserId
                         && c.VacancyId == vacancyId
                         && c.Status == ContactRequestStatus.Pending,
                    cancellationToken);
        }

        public Task<int> CountByEmployerAsync(int employerUserId, ContactRequestStatus? status, CancellationToken cancellationToken = default)
        {
            var query = _context.ContactRequests
                .AsNoTracking()
                .Where(c => c.EmployerId == employerUserId);

            if (status.HasValue)
            {
                query = query.Where(c => c.Status == status.Value);
            }

            return query.CountAsync(cancellationToken);
        }

        public Task<bool> HasRequestsForVacancyAsync(int vacancyId, CancellationToken cancellationToken = default)
        {
            return _context.ContactRequests
                .AsNoTracking()
                .AnyAsync(c => c.VacancyId == vacancyId, cancellationToken);
        }

        public async Task AddAsync(ContactRequest contactRequest, CancellationToken cancellationToken = default)
        {
            await _context.ContactRequests.AddAsync(contactRequest, cancellationToken);
        }

        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return _context.SaveChangesAsync(cancellationToken);
        }

        private IQueryable<ContactRequest> BuildReadQuery()
        {
            return _context.ContactRequests
                .AsNoTracking()
                .Include(c => c.Employer)
                    .ThenInclude(u => u.EmployerProfile)
                .Include(c => c.JobSeeker)
                    .ThenInclude(u => u.JobSeekerProfile)
                .Include(c => c.Vacancy);
        }
    }
}
