using Microsoft.EntityFrameworkCore;
using Smart_team_project.Data;
using Smart_team_project.Interfaces.Repositories;
using Smart_team_project.Models.Entities;
using Smart_team_project.Models.Enums;

namespace Smart_team_project.Repositories
{
    public class JobRepository : IJobRepository
    {
        private readonly AppDbContext _context;

        public JobRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<(List<Vacancy> Items, int TotalItems)> SearchAsync(
            string? search,
            string? location,
            int? minimumExperience,
            VacancyStatus? status,
            int? employerUserId,
            int pageNumber,
            int pageSize,
            CancellationToken cancellationToken = default)
        {
            var query = BuildReadQuery();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(v =>
                    EF.Functions.Like(v.Title, $"%{term}%") ||
                    EF.Functions.Like(v.Description, $"%{term}%") ||
                    v.VacancySkills.Any(vs => EF.Functions.Like(vs.Skill.Name, $"%{term}%")));
            }

            if (!string.IsNullOrWhiteSpace(location))
            {
                var term = location.Trim();
                query = query.Where(v => EF.Functions.Like(v.Location, $"%{term}%"));
            }

            if (minimumExperience.HasValue)
            {
                query = query.Where(v => v.RequiredExperience >= minimumExperience.Value);
            }

            if (status.HasValue)
            {
                query = query.Where(v => v.Status == status.Value);
            }

            if (employerUserId.HasValue)
            {
                query = query.Where(v => v.EmployerId == employerUserId.Value);
            }

            var totalItems = await query.CountAsync(cancellationToken);

            var items = await query
                .OrderByDescending(v => v.CreatedAt)
                .ThenByDescending(v => v.Id)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            return (items, totalItems);
        }

        public Task<List<Vacancy>> GetOpenVacanciesAsync(CancellationToken cancellationToken = default)
        {
            return BuildReadQuery()
                .Where(v => v.Status == VacancyStatus.Open)
                .OrderByDescending(v => v.CreatedAt)
                .ToListAsync(cancellationToken);
        }

        public Task<Vacancy?> GetByIdAsync(int vacancyId, CancellationToken cancellationToken = default)
        {
            return BuildReadQuery().FirstOrDefaultAsync(v => v.Id == vacancyId, cancellationToken);
        }

        public Task<Vacancy?> GetTrackedByIdAsync(int vacancyId, CancellationToken cancellationToken = default)
        {
            return _context.Vacancies
                .Include(v => v.Employer)
                    .ThenInclude(u => u.EmployerProfile)
                .Include(v => v.VacancySkills)
                    .ThenInclude(vs => vs.Skill)
                .FirstOrDefaultAsync(v => v.Id == vacancyId, cancellationToken);
        }

        public async Task<Dictionary<int, int>> GetApplicantCountsAsync(IEnumerable<int> vacancyIds, CancellationToken cancellationToken = default)
        {
            var ids = vacancyIds.Distinct().ToList();

            if (ids.Count == 0)
            {
                return new Dictionary<int, int>();
            }

            var rows = await _context.JobApplications
                .AsNoTracking()
                .Where(a => ids.Contains(a.VacancyId))
                .GroupBy(a => a.VacancyId)
                .Select(g => new { VacancyId = g.Key, Count = g.Count() })
                .ToListAsync(cancellationToken);

            return rows.ToDictionary(r => r.VacancyId, r => r.Count);
        }

        public Task<int> CountAsync(VacancyStatus? status, int? employerUserId, CancellationToken cancellationToken = default)
        {
            var query = _context.Vacancies.AsNoTracking();

            if (status.HasValue)
            {
                query = query.Where(v => v.Status == status.Value);
            }

            if (employerUserId.HasValue)
            {
                query = query.Where(v => v.EmployerId == employerUserId.Value);
            }

            return query.CountAsync(cancellationToken);
        }

        public Task<List<Vacancy>> GetByEmployerAsync(int employerUserId, VacancyStatus? status, CancellationToken cancellationToken = default)
        {
            var query = BuildReadQuery().Where(v => v.EmployerId == employerUserId);

            if (status.HasValue)
            {
                query = query.Where(v => v.Status == status.Value);
            }

            return query
                .OrderByDescending(v => v.CreatedAt)
                .ToListAsync(cancellationToken);
        }

        public Task<List<Skill>> EnsureSkillsAsync(IEnumerable<string> skillNames, CancellationToken cancellationToken = default)
        {
            return SkillCatalog.EnsureAsync(_context, skillNames, cancellationToken);
        }

        public async Task AddAsync(Vacancy vacancy, CancellationToken cancellationToken = default)
        {
            await _context.Vacancies.AddAsync(vacancy, cancellationToken);
        }

        public void Remove(Vacancy vacancy)
        {
            _context.Vacancies.Remove(vacancy);
        }

        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return _context.SaveChangesAsync(cancellationToken);
        }

        private IQueryable<Vacancy> BuildReadQuery()
        {
            return _context.Vacancies
                .AsNoTracking()
                .Include(v => v.Employer)
                    .ThenInclude(u => u.EmployerProfile)
                .Include(v => v.VacancySkills)
                    .ThenInclude(vs => vs.Skill);
        }
    }
}
