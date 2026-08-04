using System.ComponentModel.DataAnnotations;

namespace Smart_team_project.DTOs.Admin
{
    public class AdminDashboardDto
    {
        public int TotalUsers { get; set; }
        public int JobSeekers { get; set; }
        public int Employers { get; set; }
        public int ActiveUsers { get; set; }
        public int DisabledUsers { get; set; }
        public int TotalVacancies { get; set; }
        public int OpenVacancies { get; set; }
        public int ClosedVacancies { get; set; }
        public int TotalApplications { get; set; }
    }

    public class AdminUserDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? CompanyName { get; set; }
        public string? ProfessionalTitle { get; set; }
        public string? Location { get; set; }
    }

    public class UpdateUserStatusDto
    {
        [Required]
        public bool IsActive { get; set; }
    }

    public class ApplicationSettingDto
    {
        public int Id { get; set; }
        public string ApplicationName { get; set; } = string.Empty;
        public int DefaultPageSize { get; set; }
        public string MaintenanceMessage { get; set; } = string.Empty;
        public DateTime UpdatedAt { get; set; }
    }

    public class UpdateApplicationSettingDto
    {
        [Required, MaxLength(150)]
        public string ApplicationName { get; set; } = string.Empty;

        [Range(1, 50)]
        public int DefaultPageSize { get; set; }

        [MaxLength(500)]
        public string MaintenanceMessage { get; set; } = string.Empty;
    }

    public class AdminUserSearchRequestDto
    {
        public string? Search { get; set; }
        public string? Role { get; set; }
        public bool? IsActive { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
