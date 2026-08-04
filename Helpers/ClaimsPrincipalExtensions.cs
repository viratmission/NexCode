using System.Security.Claims;

namespace Smart_team_project.Helpers
{
    public static class ClaimsPrincipalExtensions
    {
        public static int GetUserId(this ClaimsPrincipal user)
        {
            var value = user.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? user.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(value) || !int.TryParse(value, out var userId))
            {
                throw new UnauthorizedAccessException("User ID claim is missing or invalid.");
            }

            return userId;
        }

        public static string? GetEmail(this ClaimsPrincipal user)
        {
            return user.FindFirstValue(ClaimTypes.Email) ?? user.FindFirstValue("email");
        }

        public static string? GetRole(this ClaimsPrincipal user)
        {
            return user.FindFirstValue(ClaimTypes.Role);
        }
    }
}
