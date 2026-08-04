using System.Collections.Concurrent;
using Microsoft.Extensions.Caching.Memory;
using Smart_team_project.Caching;
using Smart_team_project.Interfaces.Services;

namespace Smart_team_project.Caching
{
    public class CacheService : ICacheService
    {
        private readonly IMemoryCache _cache;
        private readonly ConcurrentDictionary<string, byte> _trackedKeys = new();

        public CacheService(IMemoryCache cache)
        {
            _cache = cache;
        }

        public T? Get<T>(string key)
        {
            return _cache.TryGetValue(key, out T? value) ? value : default;
        }

        public void Set<T>(string key, T value, TimeSpan absoluteExpiration)
        {
            _cache.Set(key, value, absoluteExpiration);
            _trackedKeys.TryAdd(key, 0);
        }

        public void Remove(string key)
        {
            _cache.Remove(key);
            _trackedKeys.TryRemove(key, out _);
        }

        public void RemoveByPrefix(string prefix)
        {
            var keys = _trackedKeys.Keys.Where(k => k.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)).ToList();
            foreach (var key in keys)
            {
                Remove(key);
            }
        }

        public void RemoveMatchCacheForJobSeeker(int jobSeekerId)
        {
            RemoveByPrefix($"{CacheKeys.MatchPrefix}{jobSeekerId}:");
        }

        public void RemoveMatchCacheForVacancy(int vacancyId)
        {
            var keys = _trackedKeys.Keys
                .Where(k => k.StartsWith(CacheKeys.MatchPrefix, StringComparison.OrdinalIgnoreCase)
                            && k.EndsWith($":{vacancyId}", StringComparison.OrdinalIgnoreCase))
                .ToList();

            foreach (var key in keys)
            {
                Remove(key);
            }
        }

        public void RemoveVacancyCaches()
        {
            RemoveByPrefix(CacheKeys.VacancyPrefix);
            RemoveByPrefix(CacheKeys.VacancyDetailPrefix);
            RemoveDashboardCaches();
        }

        public void RemoveDashboardCaches()
        {
            RemoveByPrefix(CacheKeys.DashboardPrefix);
            Remove(CacheKeys.AdminDashboard);
        }
    }
}
