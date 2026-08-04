using Smart_team_project.Models.Entities;

namespace Smart_team_project.Interfaces.Repositories
{
    public interface IJobSeekerRepository
    {
        Task<JobSeekerProfile?> GetByUserIdAsync(int userId, CancellationToken cancellationToken = default);

        Task<JobSeekerProfile?> GetTrackedByUserIdAsync(int userId, CancellationToken cancellationToken = default);

        Task<JobSeekerProfile?> GetByIdAsync(int profileId, CancellationToken cancellationToken = default);

        Task AddAsync(JobSeekerProfile profile, CancellationToken cancellationToken = default);

        Task<List<Skill>> EnsureSkillsAsync(IEnumerable<string> skillNames, CancellationToken cancellationToken = default);

        Task<List<Skill>> GetAllSkillsAsync(CancellationToken cancellationToken = default);

        Task<CvDocument?> GetCvByProfileIdAsync(int profileId, CancellationToken cancellationToken = default);

        Task<CvDocument?> GetTrackedCvByProfileIdAsync(int profileId, CancellationToken cancellationToken = default);

        Task AddCvAsync(CvDocument document, CancellationToken cancellationToken = default);

        void RemoveCv(CvDocument document);

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
