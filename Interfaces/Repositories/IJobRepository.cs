using Smart_team_project.Models.Entities;
using Smart_team_project.Models.Enums;

namespace Smart_team_project.Interfaces.Repositories
{
    public interface IJobRepository
    {
        Task<(List<Vacancy> Items, int TotalItems)> SearchAsync(
            string? search,
            string? location,
            int? minimumExperience,
            VacancyStatus? status,
            int? employerUserId,
            int pageNumber,
            int pageSize,
            CancellationToken cancellationToken = default);

        Task<List<Vacancy>> GetOpenVacanciesAsync(CancellationToken cancellationToken = default);

        Task<Vacancy?> GetByIdAsync(int vacancyId, CancellationToken cancellationToken = default);

        Task<Vacancy?> GetTrackedByIdAsync(int vacancyId, CancellationToken cancellationToken = default);

        Task<Dictionary<int, int>> GetApplicantCountsAsync(IEnumerable<int> vacancyIds, CancellationToken cancellationToken = default);

        Task<int> CountAsync(VacancyStatus? status, int? employerUserId, CancellationToken cancellationToken = default);

        Task<List<Vacancy>> GetByEmployerAsync(int employerUserId, VacancyStatus? status, CancellationToken cancellationToken = default);

        Task<List<Skill>> EnsureSkillsAsync(IEnumerable<string> skillNames, CancellationToken cancellationToken = default);

        Task AddAsync(Vacancy vacancy, CancellationToken cancellationToken = default);

        void Remove(Vacancy vacancy);

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
