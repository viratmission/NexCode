using Microsoft.AspNetCore.Identity;
using Smart_team_project.DTOs.Auth;
using Smart_team_project.Exceptions;
using Smart_team_project.Interfaces.Repositories;
using Smart_team_project.Interfaces.Services;
using Smart_team_project.Models.Entities;
using Smart_team_project.Models.Enums;

namespace Smart_team_project.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _users;
        private readonly IJobSeekerRepository _jobSeekers;
        private readonly IEmployerRepository _employers;
        private readonly IJwtTokenService _tokenService;
        private readonly PasswordHasher<User> _passwordHasher;
        private readonly ICacheService _cache;
        private readonly ILogger<AuthService> _logger;

        public AuthService(
            IUserRepository users,
            IJobSeekerRepository jobSeekers,
            IEmployerRepository employers,
            IJwtTokenService tokenService,
            PasswordHasher<User> passwordHasher,
            ICacheService cache,
            ILogger<AuthService> logger)
        {
            _users = users;
            _jobSeekers = jobSeekers;
            _employers = employers;
            _tokenService = tokenService;
            _passwordHasher = passwordHasher;
            _cache = cache;
            _logger = logger;
        }

        public async Task<AuthResponseDto> RegisterJobSeekerAsync(RegisterJobSeekerDto request, CancellationToken cancellationToken = default)
        {
            await EnsureEmailIsAvailableAsync(request.Email, cancellationToken);

            var now = DateTime.UtcNow;

            var user = new User
            {
                FullName = request.FullName.Trim(),
                Email = request.Email.Trim(),
                Role = UserRole.JobSeeker,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

            await _users.AddAsync(user, cancellationToken);
            await _users.SaveChangesAsync(cancellationToken);

            var profile = new JobSeekerProfile
            {
                UserId = user.Id,
                ProfessionalTitle = string.Empty,
                Location = string.Empty,
                YearsOfExperience = 0,
                Education = string.Empty,
                About = string.Empty,
                CreatedAt = now,
                UpdatedAt = now
            };

            await _jobSeekers.AddAsync(profile, cancellationToken);
            await _jobSeekers.SaveChangesAsync(cancellationToken);

            _cache.RemoveDashboardCaches();
            _logger.LogInformation("Registered job seeker {Email}.", user.Email);

            return BuildAuthResponse(user);
        }

        public async Task<AuthResponseDto> RegisterEmployerAsync(RegisterEmployerDto request, CancellationToken cancellationToken = default)
        {
            await EnsureEmailIsAvailableAsync(request.Email, cancellationToken);

            var now = DateTime.UtcNow;

            var user = new User
            {
                FullName = request.FullName.Trim(),
                Email = request.Email.Trim(),
                Role = UserRole.Employer,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            };

            user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

            await _users.AddAsync(user, cancellationToken);
            await _users.SaveChangesAsync(cancellationToken);

            var profile = new EmployerProfile
            {
                UserId = user.Id,
                CompanyName = request.CompanyName.Trim(),
                Industry = string.Empty,
                Location = string.Empty,
                Description = string.Empty,
                CreatedAt = now,
                UpdatedAt = now
            };

            await _employers.AddAsync(profile, cancellationToken);
            await _employers.SaveChangesAsync(cancellationToken);

            _cache.RemoveDashboardCaches();
            _logger.LogInformation("Registered employer {Email}.", user.Email);

            return BuildAuthResponse(user);
        }

        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default)
        {
            var user = await _users.GetByEmailAsync(request.Email, cancellationToken);

            if (user == null)
            {
                throw new UnauthorizedException("Invalid email or password.");
            }

            var verification = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);

            if (verification == PasswordVerificationResult.Failed)
            {
                throw new UnauthorizedException("Invalid email or password.");
            }

            if (!user.IsActive)
            {
                throw new ForbiddenException("This account has been disabled. Please contact an administrator.");
            }

            _logger.LogInformation("User {UserId} signed in.", user.Id);

            return BuildAuthResponse(user);
        }

        public async Task<CurrentUserDto> GetCurrentUserAsync(int userId, CancellationToken cancellationToken = default)
        {
            var user = await _users.GetByIdAsync(userId, cancellationToken)
                ?? throw new NotFoundException("User was not found.");

            return MapCurrentUser(user);
        }

        private async Task EnsureEmailIsAvailableAsync(string email, CancellationToken cancellationToken)
        {
            if (await _users.EmailExistsAsync(email, cancellationToken))
            {
                throw new ConflictException("An account with this email address already exists.");
            }
        }

        private AuthResponseDto BuildAuthResponse(User user)
        {
            var (token, expiresAt) = _tokenService.CreateToken(user);

            return new AuthResponseDto
            {
                Token = token,
                ExpiresAt = expiresAt,
                User = MapCurrentUser(user)
            };
        }

        private static CurrentUserDto MapCurrentUser(User user) => new()
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.ToString(),
            IsActive = user.IsActive
        };
    }
}
