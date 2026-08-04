namespace Smart_team_project.Models.Entities
{
    public class CvDocument
    {
        public int Id { get; set; }
        public int JobSeekerId { get; set; }
        public string OriginalFileName { get; set; } = string.Empty;
        public string StoredFileName { get; set; } = string.Empty;
        public string RelativeFilePath { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public DateTime UploadedAt { get; set; }

        public JobSeekerProfile JobSeekerProfile { get; set; } = null!;
    }
}
