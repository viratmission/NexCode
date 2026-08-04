using Microsoft.EntityFrameworkCore;
using Smart_team_project.Data;
using Smart_team_project.Interfaces.Repositories;
using Smart_team_project.Models.Entities;
using Smart_team_project.Models.Enums;

namespace Smart_team_project.Repositories
{
    public class ApplicationRepository : IApplicationRepository
    {
        private readonly AppDbContext _context;

        public ApplicationRepository(AppDbContext context)
        {
            _context = context;
        }

        public Task<bool> ExistsAsync(int vacancyId, int jobSeekerUserId, CancellationToken cancellationToken = default)
        {
            return _context.JobApplications
                .AsNoTracking()
                .AnyAsync(a => a.VacancyId == vacancyId && a.JobSeekerId == jobSeekerUserId, cancellationToken);
        }

        public Task<JobApplication?> GetByIdAsync(int applicationId, CancellationToken cancellationToken = default)
        {
            return BuildReadQuery().FirstOrDefaultAsync(a => a.Id == applicationId, cancellationToken);
        }

        public Task<JobApplication?> GetTrackedByIdAsync(int applicationId, CancellationToken cancellationToken = default)
        {
            return _context.JobApplications
                .Include(a => a.Vacancy)
                .Include(a => a.JobSeeker)
                .FirstOrDefaultAsync(a => a.Id == applicationId, cancellationToken);
        }

        public Task<List<JobApplication>> GetByJobSeekerAsync(int jobSeekerUserId, CancellationToken cancellationToken = default)
        {
            return BuildReadQuery()
                .Where(a => a.JobSeekerId == jobSeekerUserId)
                .OrderByDescending(a => a.AppliedAt)
                .ToListAsync(cancellationToken);
        }

        public Task<List<JobApplication>> GetByVacancyAsync(int vacancyId, CancellationToken cancellationToken = default)
        {
            return BuildReadQuery()
                .Where(a => a.VacancyId == vacancyId)
                .OrderByDescending(a => a.MatchScore)
                .ThenByDescending(a => a.AppliedAt)
                .ToListAsync(cancellationToken);
        }

        public async Task<(List<JobApplication> Items, int TotalItems)> GetByEmployerAsync(
            int employerUserId,
            int? vacancyId,
            ApplicationStatus? status,
            int pageNumber,
            int pageSize,
            CancellationToken cancellationToken = default)
        {
            var query = BuildReadQuery().Where(a => a.Vacancy.EmployerId == employerUserId);

            if (vacancyId.HasValue)
            {
                query = query.Where(a => a.VacancyId == vacancyId.Value);
            }

            if (status.HasValue)
            {
                query = query.Where(a => a.Status == status.Value);
            }

            var totalItems = await query.CountAsync(cancellationToken);

            var items = await query
                .OrderByDescending(a => a.MatchScore)
                .ThenByDescending(a => a.AppliedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            return (items, totalItems);
        }

        public Task<int> CountByEmployerAsync(int employerUserId, ApplicationStatus? status, CancellationToken cancellationToken = default)
        {
            var query = _context.JobApplications
                .AsNoTracking()
                .Where(a => a.Vacancy.EmployerId == employerUserId);

            if (status.HasValue)
            {
                query = query.Where(a => a.Status == status.Value);
            }

            return query.CountAsync(cancellationToken);
        }

        public Task<int> CountByJobSeekerAsync(int jobSeekerUserId, CancellationToken cancellationToken = default)
        {
            return _context.JobApplications
                .AsNoTracking()
                .CountAsync(a => a.JobSeekerId == jobSeekerUserId, cancellationToken);
        }

        public Task<int> CountAllAsync(CancellationToken cancellationToken = default)
        {
            return _context.JobApplications.AsNoTracking().CountAsync(cancellationToken);
        }

        public async Task<int?> GetBestMatchScoreAsync(int jobSeekerUserId, CancellationToken cancellationToken = default)
        {
            var scores = await _context.JobApplications
                .AsNoTracking()
                .Where(a => a.JobSeekerId == jobSeekerUserId)
                .Select(a => a.MatchScore)
                .ToListAsync(cancellationToken);

            return scores.Count == 0 ? null : scores.Max();
        }

        public async Task<HashSet<int>> GetAppliedVacancyIdsAsync(int jobSeekerUserId, CancellationToken cancellationToken = default)
        {
            var ids = await _context.JobApplications
                .AsNoTracking()
                .Where(a => a.JobSeekerId == jobSeekerUserId)
                .Select(a => a.VacancyId)
                .ToListAsync(cancellationToken);

            return ids.ToHashSet();
        }

        public Task<bool> HasApplicationsAsync(int vacancyId, CancellationToken cancellationToken = default)
        {
            return _context.JobApplications
                .AsNoTracking()
                .AnyAsync(a => a.VacancyId == vacancyId, cancellationToken);
        }

        public async Task AddAsync(JobApplication application, CancellationToken cancellationToken = default)
        {
            await _context.JobApplications.AddAsync(application, cancellationToken);
        }

        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return _context.SaveChangesAsync(cancellationToken);
        }

        private IQueryable<JobApplication> BuildReadQuery()
        {
            return _context.JobApplications
                .AsNoTracking()
                .Include(a => a.Vacancy)
                    .ThenInclude(v => v.Employer)
                        .ThenInclude(u => u.EmployerProfile)
                .Include(a => a.Vacancy)
                    .ThenInclude(v => v.VacancySkills)
                        .ThenInclude(vs => vs.Skill)
                .Include(a => a.JobSeeker)
                    .ThenInclude(u => u.JobSeekerProfile!)
                        .ThenInclude(p => p.JobSeekerSkills)
                            .ThenInclude(s => s.Skill)
                .Include(a => a.JobSeeker)
                    .ThenInclude(u => u.JobSeekerProfile!)
                        .ThenInclude(p => p.CvDocument);
        }
    }
}
