namespace Smart_team_project.Interfaces.Services
{
    public sealed record StoredFileInfo(
        string OriginalFileName,
        string StoredFileName,
        string RelativeFilePath,
        string ContentType,
        long FileSize);

    public interface IFileStorageService
    {
        Task<StoredFileInfo> SaveCvAsync(IFormFile file, int jobSeekerProfileId, CancellationToken cancellationToken = default);

        Task<byte[]> ReadAsync(string relativeFilePath, CancellationToken cancellationToken = default);

        bool Exists(string relativeFilePath);

        void Delete(string relativeFilePath);
    }
}
