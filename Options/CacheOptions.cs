namespace Smart_team_project.Options
{
    public class CacheOptions
    {
        public const string SectionName = "Cache";

        public int VacancyMinutes { get; set; } = 5;
        public int MatchMinutes { get; set; } = 5;
        public int DashboardMinutes { get; set; } = 3;
    }
}
