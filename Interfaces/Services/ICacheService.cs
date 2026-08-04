using Microsoft.Extensions.Caching.Memory;

namespace Smart_team_project.Interfaces.Services
{
    public interface ICacheService
    {
        T? Get<T>(string key);
        void Set<T>(string key, T value, TimeSpan absoluteExpiration);
        void Remove(string key);
        void RemoveByPrefix(string prefix);
        void RemoveMatchCacheForJobSeeker(int jobSeekerId);
        void RemoveMatchCacheForVacancy(int vacancyId);
        void RemoveVacancyCaches();
        void RemoveDashboardCaches();
    }
}
