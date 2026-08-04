using Microsoft.EntityFrameworkCore;
using Smart_team_project.Data;
using Smart_team_project.Interfaces.Repositories;
using Smart_team_project.Models.Entities;

namespace Smart_team_project.Repositories
{
    public class JobSeekerRepository : IJobSeekerRepository
    {
        private readonly AppDbContext _context;

        public JobSeekerRepository(AppDbContext context)
        {
            _context = context;
        }

        public Task<JobSeekerProfile?> GetByUserIdAsync(int userId, CancellationToken cancellationToken = default)
        {
            return _context.JobSeekerProfiles
                .AsNoTracking()
                .Include(p => p.User)
                .Include(p => p.JobSeekerSkills)
                    .ThenInclude(s => s.Skill)
                .Include(p => p.CvDocument)
                .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
        }

        public Task<JobSeekerProfile?> GetTrackedByUserIdAsync(int userId, CancellationToken cancellationToken = default)
        {
            return _context.JobSeekerProfiles
                .Include(p => p.User)
                .Include(p => p.JobSeekerSkills)
                    .ThenInclude(s => s.Skill)
                .Include(p => p.CvDocument)
                .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
        }

        public Task<JobSeekerProfile?> GetByIdAsync(int profileId, CancellationToken cancellationToken = default)
        {
            return _context.JobSeekerProfiles
                .AsNoTracking()
                .Include(p => p.User)
                .Include(p => p.JobSeekerSkills)
                    .ThenInclude(s => s.Skill)
                .Include(p => p.CvDocument)
                .FirstOrDefaultAsync(p => p.Id == profileId, cancellationToken);
        }

        public async Task AddAsync(JobSeekerProfile profile, CancellationToken cancellationToken = default)
        {
            await _context.JobSeekerProfiles.AddAsync(profile, cancellationToken);
        }

        public Task<List<Skill>> EnsureSkillsAsync(IEnumerable<string> skillNames, CancellationToken cancellationToken = default)
        {
            return SkillCatalog.EnsureAsync(_context, skillNames, cancellationToken);
        }

        public Task<List<Skill>> GetAllSkillsAsync(CancellationToken cancellationToken = default)
        {
            return _context.Skills
                .AsNoTracking()
                .OrderBy(s => s.Name)
                .ToListAsync(cancellationToken);
        }

        public Task<CvDocument?> GetCvByProfileIdAsync(int profileId, CancellationToken cancellationToken = default)
        {
            return _context.CvDocuments
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.JobSeekerId == profileId, cancellationToken);
        }

        public Task<CvDocument?> GetTrackedCvByProfileIdAsync(int profileId, CancellationToken cancellationToken = default)
        {
            return _context.CvDocuments
                .FirstOrDefaultAsync(c => c.JobSeekerId == profileId, cancellationToken);
        }

        public async Task AddCvAsync(CvDocument document, CancellationToken cancellationToken = default)
        {
            await _context.CvDocuments.AddAsync(document, cancellationToken);
        }

        public void RemoveCv(CvDocument document)
        {
            _context.CvDocuments.Remove(document);
        }

        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return _context.SaveChangesAsync(cancellationToken);
        }
    }
}
