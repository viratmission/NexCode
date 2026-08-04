namespace Smart_team_project.Caching
{
    public static class CacheKeys
    {
        public static string OpenVacancies(string search, string location, int page, int size)
            => $"open-vacancies:{search}:{location}:{page}:{size}";

        public static string Vacancy(int vacancyId) => $"vacancy:{vacancyId}";

        public static string Match(int jobSeekerId, int vacancyId) => $"match:{jobSeekerId}:{vacancyId}";

        public static string Dashboard(string role, int userId) => $"dashboard:{role}:{userId}";

        public static string Skills => "skills:all";

        public static string AdminDashboard => "dashboard:admin";

        public const string VacancyPrefix = "open-vacancies:";
        public const string VacancyDetailPrefix = "vacancy:";
        public const string MatchPrefix = "match:";
        public const string DashboardPrefix = "dashboard:";
    }
}
