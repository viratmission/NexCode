using Microsoft.Extensions.Options;
using Smart_team_project.Caching;
using Smart_team_project.DTOs.Admin;
using Smart_team_project.DTOs.Common;
using Smart_team_project.Exceptions;
using Smart_team_project.Interfaces.Repositories;
using Smart_team_project.Interfaces.Services;
using Smart_team_project.Models.Entities;
using Smart_team_project.Models.Enums;
using Smart_team_project.Options;

namespace Smart_team_project.Services
{
    public class AdminService : IAdminService
    {
        private const int MaxPageSize = 50;

        private readonly IAdminRepository _admin;
        private readonly IUserRepository _users;
        private readonly IJobRepository _jobs;
        private readonly IApplicationRepository _applications;
        private readonly ICacheService _cache;
        private readonly CacheOptions _cacheOptions;
        private readonly ILogger<AdminService> _logger;

        public AdminService(
            IAdminRepository admin,
            IUserRepository users,
            IJobRepository jobs,
            IApplicationRepository applications,
            ICacheService cache,
            IOptions<CacheOptions> cacheOptions,
            ILogger<AdminService> logger)
        {
            _admin = admin;
            _users = users;
            _jobs = jobs;
            _applications = applications;
            _cache = cache;
            _cacheOptions = cacheOptions.Value;
            _logger = logger;
        }

        public async Task<AdminDashboardDto> GetDashboardAsync(CancellationToken cancellationToken = default)
        {
            var cached = _cache.Get<AdminDashboardDto>(CacheKeys.AdminDashboard);
            if (cached != null)
            {
                return cached;
            }

            var statistics = await _admin.GetUserStatisticsAsync(cancellationToken);
            var totalVacancies = await _jobs.CountAsync(null, null, cancellationToken);
            var openVacancies = await _jobs.CountAsync(VacancyStatus.Open, null, cancellationToken);
            var closedVacancies = await _jobs.CountAsync(VacancyStatus.Closed, null, cancellationToken);
            var totalApplications = await _applications.CountAllAsync(cancellationToken);

            var dashboard = new AdminDashboardDto
            {
                TotalUsers = statistics.TotalUsers,
                JobSeekers = statistics.JobSeekers,
                Employers = statistics.Employers,
                ActiveUsers = statistics.ActiveUsers,
                DisabledUsers = statistics.DisabledUsers,
                TotalVacancies = totalVacancies,
                OpenVacancies = openVacancies,
                ClosedVacancies = closedVacancies,
                TotalApplications = totalApplications
            };

            _cache.Set(CacheKeys.AdminDashboard, dashboard, TimeSpan.FromMinutes(_cacheOptions.DashboardMinutes));

            return dashboard;
        }

        public async Task<PagedResultDto<AdminUserDto>> GetUsersAsync(AdminUserSearchRequestDto request, CancellationToken cancellationToken = default)
        {
            var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
            var pageSize = request.PageSize < 1 ? 10 : Math.Min(request.PageSize, MaxPageSize);

            UserRole? role = null;
            if (!string.IsNullOrWhiteSpace(request.Role))
            {
                if (!Enum.TryParse<UserRole>(request.Role.Trim(), true, out var parsedRole))
                {
                    throw new BadRequestException(
                        $"Role must be one of: {string.Join(", ", Enum.GetNames<UserRole>())}.");
                }

                role = parsedRole;
            }

            var (items, totalItems) = await _admin.GetUsersAsync(
                request.Search,
                role,
                request.IsActive,
                pageNumber,
                pageSize,
                cancellationToken);

            return new PagedResultDto<AdminUserDto>
            {
                Items = items.Select(MapUser).ToList(),
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
            };
        }

        public async Task<AdminUserDto> GetUserAsync(int userId, CancellationToken cancellationToken = default)
        {
            var user = await _admin.GetUserWithProfilesAsync(userId, cancellationToken)
                ?? throw new NotFoundException("User was not found.");

            return MapUser(user);
        }

        public async Task<AdminUserDto> UpdateUserStatusAsync(int userId, UpdateUserStatusDto request, CancellationToken cancellationToken = default)
        {
            var user = await _users.GetTrackedByIdAsync(userId, cancellationToken)
                ?? throw new NotFoundException("User was not found.");

            if (user.Role == UserRole.Administrator && !request.IsActive)
            {
                throw new ConflictException("Administrator accounts cannot be disabled.");
            }

            if (user.IsActive == request.IsActive)
            {
                throw new ConflictException($"This account is already {(request.IsActive ? "active" : "disabled")}.");
            }

            user.IsActive = request.IsActive;
            user.UpdatedAt = DateTime.UtcNow;

            await _users.SaveChangesAsync(cancellationToken);

            _cache.RemoveDashboardCaches();

            _logger.LogInformation(
                "Administrator {Action} user {UserId}.",
                request.IsActive ? "enabled" : "disabled",
                userId);

            var refreshed = await _admin.GetUserWithProfilesAsync(userId, cancellationToken)
                ?? throw new NotFoundException("User was not found.");

            return MapUser(refreshed);
        }

        public async Task<ApplicationSettingDto> GetSettingsAsync(CancellationToken cancellationToken = default)
        {
            var settings = await _admin.GetSettingsAsync(cancellationToken)
                           ?? await _admin.GetTrackedSettingsAsync(cancellationToken);

            return MapSettings(settings);
        }

        public async Task<ApplicationSettingDto> UpdateSettingsAsync(UpdateApplicationSettingDto request, CancellationToken cancellationToken = default)
        {
            var settings = await _admin.GetTrackedSettingsAsync(cancellationToken);

            settings.ApplicationName = request.ApplicationName.Trim();
            settings.DefaultPageSize = request.DefaultPageSize;
            settings.MaintenanceMessage = request.MaintenanceMessage?.Trim() ?? string.Empty;
            settings.UpdatedAt = DateTime.UtcNow;

            await _admin.SaveChangesAsync(cancellationToken);

            _cache.RemoveVacancyCaches();
            _logger.LogInformation("Administrator updated application settings.");

            return MapSettings(settings);
        }

        private static AdminUserDto MapUser(User user) => new()
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.ToString(),
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            CompanyName = user.EmployerProfile?.CompanyName,
            ProfessionalTitle = user.JobSeekerProfile?.ProfessionalTitle,
            Location = user.EmployerProfile?.Location ?? user.JobSeekerProfile?.Location
        };

        private static ApplicationSettingDto MapSettings(ApplicationSetting settings) => new()
        {
            Id = settings.Id,
            ApplicationName = settings.ApplicationName,
            DefaultPageSize = settings.DefaultPageSize,
            MaintenanceMessage = settings.MaintenanceMessage,
            UpdatedAt = settings.UpdatedAt
        };
    }
}
