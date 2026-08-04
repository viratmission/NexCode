namespace Smart_team_project.Models.Entities
{
    public class ApplicationSetting
    {
        public int Id { get; set; }
        public string ApplicationName { get; set; } = "MatchPoint";
        public int DefaultPageSize { get; set; } = 10;
        public string MaintenanceMessage { get; set; } = string.Empty;
        public DateTime UpdatedAt { get; set; }
    }
}
