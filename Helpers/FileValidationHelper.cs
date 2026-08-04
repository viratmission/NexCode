using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Smart_team_project.Options;

namespace Smart_team_project.Helpers
{
    public static class FileValidationHelper
    {
        public static (bool IsValid, string? Error) ValidateCv(IFormFile? file, FileUploadOptions options)
        {
            if (file == null || file.Length == 0)
            {
                return (false, "A CV file is required.");
            }

            if (file.Length > options.MaxFileSizeBytes)
            {
                return (false, $"File size must not exceed {options.MaxFileSizeBytes / (1024 * 1024)} MB.");
            }

            var extension = Path.GetExtension(file.FileName)?.ToLowerInvariant() ?? string.Empty;
            if (!options.AllowedExtensions.Contains(extension))
            {
                return (false, $"Only {string.Join(", ", options.AllowedExtensions)} files are allowed.");
            }

            if (!string.IsNullOrWhiteSpace(file.ContentType)
                && options.AllowedContentTypes.Length > 0
                && !options.AllowedContentTypes.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase))
            {
                // Some browsers send incorrect content types; extension check is primary.
                // Soft warning — still allow when extension is valid.
            }

            return (true, null);
        }
    }
}
