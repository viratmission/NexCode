namespace Smart_team_project.Options
{
    public class FileUploadOptions
    {
        public const string SectionName = "FileUpload";

        public long MaxFileSizeBytes { get; set; } = 5 * 1024 * 1024;
        public string[] AllowedExtensions { get; set; } = [".pdf", ".doc", ".docx"];
        public string[] AllowedContentTypes { get; set; } =
        [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];
        public string StorageFolder { get; set; } = "Storage/CVs";
    }
}
