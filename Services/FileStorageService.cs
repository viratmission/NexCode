using Microsoft.Extensions.Options;
using Smart_team_project.Exceptions;
using Smart_team_project.Helpers;
using Smart_team_project.Interfaces.Services;
using Smart_team_project.Options;

namespace Smart_team_project.Services
{
    public class FileStorageService : IFileStorageService
    {
        private readonly FileUploadOptions _options;
        private readonly string _rootPath;
        private readonly ILogger<FileStorageService> _logger;

        public FileStorageService(
            IOptions<FileUploadOptions> options,
            IWebHostEnvironment environment,
            ILogger<FileStorageService> logger)
        {
            _options = options.Value;
            _logger = logger;

            var storageFolder = _options.StorageFolder.Replace('/', Path.DirectorySeparatorChar);
            _rootPath = Path.Combine(environment.ContentRootPath, storageFolder);

            Directory.CreateDirectory(_rootPath);
        }

        public async Task<StoredFileInfo> SaveCvAsync(IFormFile file, int jobSeekerProfileId, CancellationToken cancellationToken = default)
        {
            var (isValid, error) = FileValidationHelper.ValidateCv(file, _options);
            if (!isValid)
            {
                throw new BadRequestException(error ?? "The uploaded file is not valid.");
            }

            var extension = Path.GetExtension(file!.FileName).ToLowerInvariant();
            var storedFileName = $"cv_{jobSeekerProfileId}_{Guid.NewGuid():N}{extension}";
            var absolutePath = Path.Combine(_rootPath, storedFileName);

            await using (var stream = new FileStream(absolutePath, FileMode.Create, FileAccess.Write, FileShare.None))
            {
                await file.CopyToAsync(stream, cancellationToken);
            }

            var relativePath = $"{_options.StorageFolder.TrimEnd('/')}/{storedFileName}";

            _logger.LogInformation("Stored CV for job seeker profile {ProfileId} at {Path}.", jobSeekerProfileId, relativePath);

            var contentType = string.IsNullOrWhiteSpace(file.ContentType)
                ? ResolveContentType(extension)
                : file.ContentType;

            return new StoredFileInfo(
                Path.GetFileName(file.FileName),
                storedFileName,
                relativePath,
                contentType,
                file.Length);
        }

        public async Task<byte[]> ReadAsync(string relativeFilePath, CancellationToken cancellationToken = default)
        {
            var absolutePath = ResolveAbsolutePath(relativeFilePath);

            if (!File.Exists(absolutePath))
            {
                throw new NotFoundException("The stored CV file could not be found on the server.");
            }

            return await File.ReadAllBytesAsync(absolutePath, cancellationToken);
        }

        public bool Exists(string relativeFilePath)
        {
            return File.Exists(ResolveAbsolutePath(relativeFilePath));
        }

        public void Delete(string relativeFilePath)
        {
            var absolutePath = ResolveAbsolutePath(relativeFilePath);

            if (File.Exists(absolutePath))
            {
                File.Delete(absolutePath);
                _logger.LogInformation("Deleted stored CV at {Path}.", relativeFilePath);
            }
        }

        private string ResolveAbsolutePath(string relativeFilePath)
        {
            var fileName = Path.GetFileName(relativeFilePath);

            if (string.IsNullOrWhiteSpace(fileName))
            {
                throw new NotFoundException("The stored CV file could not be found on the server.");
            }

            return Path.Combine(_rootPath, fileName);
        }

        private static string ResolveContentType(string extension) => extension switch
        {
            ".pdf" => "application/pdf",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            _ => "application/octet-stream"
        };
    }
}
