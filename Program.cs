using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Smart_team_project.Caching;
using Smart_team_project.Data;
using Smart_team_project.DTOs.Common;
using Smart_team_project.Interfaces.Repositories;
using Smart_team_project.Interfaces.Services;
using Smart_team_project.Middleware;
using Smart_team_project.Models.Entities;
using Smart_team_project.Options;
using Smart_team_project.Repositories;
using Smart_team_project.Services;

namespace Smart_team_project
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            ConfigureOptions(builder);
            ConfigurePersistence(builder);
            ConfigureCaching(builder);
            ConfigureRepositories(builder);
            ConfigureApplicationServices(builder);
            ConfigureAuthentication(builder);
            ConfigureApi(builder);

            var app = builder.Build();

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI(options =>
                {
                    options.SwaggerEndpoint("/swagger/v1/swagger.json", "MatchPoint API v1");
                    options.DocumentTitle = "MatchPoint API";
                });

                await InitializeDatabaseAsync(app);
            }

            app.UseMiddleware<ExceptionMiddleware>();
            app.UseHttpsRedirection();

            var defaultFiles = new DefaultFilesOptions();
            defaultFiles.DefaultFileNames.Clear();
            defaultFiles.DefaultFileNames.Add("index.html");
            app.UseDefaultFiles(defaultFiles);
            app.UseStaticFiles();

            app.UseAuthentication();
            app.UseAuthorization();
            app.MapControllers();

            app.MapGet("/", async (HttpContext context, IWebHostEnvironment environment) =>
            {
                var indexPath = Path.Combine(environment.WebRootPath, "index.html");
                context.Response.ContentType = "text/html; charset=utf-8";
                await context.Response.SendFileAsync(indexPath);
            });

            // Serve the branded 404 page for unknown non-API paths.
            app.MapFallback(async context =>
            {
                if (context.Request.Path.StartsWithSegments("/api"))
                {
                    context.Response.StatusCode = StatusCodes.Status404NotFound;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsJsonAsync(ApiResponseDto.Fail("The requested resource was not found."));
                    return;
                }

                context.Response.StatusCode = StatusCodes.Status404NotFound;
                context.Response.ContentType = "text/html; charset=utf-8";
                await context.Response.SendFileAsync(Path.Combine(app.Environment.WebRootPath, "not-found.html"));
            });

            await app.RunAsync();
        }

        private static void ConfigureOptions(WebApplicationBuilder builder)
        {
            builder.Services.AddOptions<JwtOptions>()
                .Bind(builder.Configuration.GetSection(JwtOptions.SectionName))
                .Validate(options => !string.IsNullOrWhiteSpace(options.Issuer), "Jwt:Issuer must be configured.")
                .Validate(options => !string.IsNullOrWhiteSpace(options.Audience), "Jwt:Audience must be configured.")
                .Validate(options => !string.IsNullOrWhiteSpace(options.Key) && options.Key.Length >= 32,
                    "Jwt:Key must be configured with at least 32 characters.")
                .Validate(options => options.ExpiryMinutes > 0, "Jwt:ExpiryMinutes must be greater than zero.")
                .ValidateOnStart();

            builder.Services.AddOptions<MatchingOptions>()
                .Bind(builder.Configuration.GetSection(MatchingOptions.SectionName))
                .Validate(
                    options => options.SkillsWeight
                               + options.ExperienceWeight
                               + options.EducationWeight
                               + options.LocationWeight == 100,
                    "Matching weights must total 100.")
                .ValidateOnStart();

            builder.Services.AddOptions<FileUploadOptions>()
                .Bind(builder.Configuration.GetSection(FileUploadOptions.SectionName))
                .Validate(options => options.MaxFileSizeBytes > 0, "FileUpload:MaxFileSizeBytes must be greater than zero.")
                .Validate(options => options.AllowedExtensions.Length > 0, "FileUpload:AllowedExtensions must not be empty.")
                .Validate(options => !string.IsNullOrWhiteSpace(options.StorageFolder), "FileUpload:StorageFolder must be configured.")
                .ValidateOnStart();

            builder.Services.AddOptions<CacheOptions>()
                .Bind(builder.Configuration.GetSection(CacheOptions.SectionName))
                .ValidateOnStart();
        }

        private static void ConfigurePersistence(WebApplicationBuilder builder)
        {
            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection must be configured.");

            builder.Services.AddDbContext<AppDbContext>(options =>
            {
                options.UseSqlServer(connectionString, sqlOptions =>
                {
                    sqlOptions.EnableRetryOnFailure(3);
                    sqlOptions.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
                });

                if (builder.Environment.IsDevelopment())
                {
                    options.EnableDetailedErrors();
                }
            });
        }

        private static void ConfigureCaching(WebApplicationBuilder builder)
        {
            builder.Services.AddMemoryCache();
            builder.Services.AddSingleton<ICacheService, CacheService>();
        }

        private static void ConfigureRepositories(WebApplicationBuilder builder)
        {
            builder.Services.AddScoped<IUserRepository, UserRepository>();
            builder.Services.AddScoped<IJobSeekerRepository, JobSeekerRepository>();
            builder.Services.AddScoped<IEmployerRepository, EmployerRepository>();
            builder.Services.AddScoped<IJobRepository, JobRepository>();
            builder.Services.AddScoped<IApplicationRepository, ApplicationRepository>();
            builder.Services.AddScoped<IContactRequestRepository, ContactRequestRepository>();
            builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
            builder.Services.AddScoped<IAdminRepository, AdminRepository>();
        }

        private static void ConfigureApplicationServices(WebApplicationBuilder builder)
        {
            builder.Services.AddSingleton<PasswordHasher<User>>();
            builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();
            builder.Services.AddSingleton<IFileStorageService, FileStorageService>();

            builder.Services.AddScoped<IAuthService, AuthService>();
            builder.Services.AddScoped<IMatchingService, MatchingService>();
            builder.Services.AddScoped<INotificationService, NotificationService>();
            builder.Services.AddScoped<IContactRequestService, ContactRequestService>();
            builder.Services.AddScoped<IApplicationService, ApplicationService>();
            builder.Services.AddScoped<IJobService, JobService>();
            builder.Services.AddScoped<IJobSeekerService, JobSeekerService>();
            builder.Services.AddScoped<IEmployerService, EmployerService>();
            builder.Services.AddScoped<IAdminService, AdminService>();
        }

        private static void ConfigureAuthentication(WebApplicationBuilder builder)
        {
            var jwtSection = builder.Configuration.GetSection(JwtOptions.SectionName);
            var jwtOptions = jwtSection.Get<JwtOptions>() ?? new JwtOptions();

            builder.Services
                .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
                    options.SaveToken = true;
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidIssuer = jwtOptions.Issuer,
                        ValidateAudience = true,
                        ValidAudience = jwtOptions.Audience,
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(string.IsNullOrWhiteSpace(jwtOptions.Key)
                                ? new string('0', 32)
                                : jwtOptions.Key)),
                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.FromSeconds(30)
                    };
                });

            builder.Services.AddAuthorization();
        }

        private static void ConfigureApi(WebApplicationBuilder builder)
        {
            builder.Services
                .AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
                    options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
                });

            builder.Services.Configure<ApiBehaviorOptions>(options =>
            {
                options.InvalidModelStateResponseFactory = context =>
                {
                    var errors = context.ModelState
                        .Where(entry => entry.Value?.Errors.Count > 0)
                        .ToDictionary(
                            entry => entry.Key,
                            entry => entry.Value!.Errors.Select(error => error.ErrorMessage).ToArray());

                    var response = ApiResponseDto<object>.Fail("One or more validation errors occurred.", errors);

                    return new BadRequestObjectResult(response);
                };
            });

            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(options =>
            {
                options.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "MatchPoint API",
                    Version = "v1",
                    Description = "Skill based job matching platform for job seekers, employers and administrators."
                });

                var scheme = new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Description = "Enter the JWT returned by /api/auth/login as: Bearer {token}",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.Http,
                    Scheme = JwtBearerDefaults.AuthenticationScheme,
                    BearerFormat = "JWT",
                    Reference = new OpenApiReference
                    {
                        Id = JwtBearerDefaults.AuthenticationScheme,
                        Type = ReferenceType.SecurityScheme
                    }
                };

                options.AddSecurityDefinition(JwtBearerDefaults.AuthenticationScheme, scheme);
                options.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    { scheme, Array.Empty<string>() }
                });
            });
        }

        private static async Task InitializeDatabaseAsync(WebApplication app)
        {
            using var scope = app.Services.CreateScope();

            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

            try
            {
                await context.Database.MigrateAsync();
                await DbInitializer.SeedAsync(context, logger);
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Applying migrations or seeding the database failed.");
                throw;
            }
        }
    }
}
