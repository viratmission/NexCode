using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Smart_team_project.DTOs.Common;
using Smart_team_project.Exceptions;

namespace Smart_team_project.Middleware
{
    public class ExceptionMiddleware
    {
        private const int ClientClosedRequest = 499;

        private static readonly JsonSerializerOptions SerializerOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;
        private readonly IHostEnvironment _environment;

        public ExceptionMiddleware(
            RequestDelegate next,
            ILogger<ExceptionMiddleware> logger,
            IHostEnvironment environment)
        {
            _next = next;
            _logger = logger;
            _environment = environment;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception exception)
            {
                await HandleAsync(context, exception);
            }
        }

        private async Task HandleAsync(HttpContext context, Exception exception)
        {
            if (context.Response.HasStarted)
            {
                _logger.LogError(exception, "An unhandled exception occurred after the response had started.");
                return;
            }

            var (statusCode, message, errors) = Translate(exception);

            if (statusCode >= StatusCodes.Status500InternalServerError)
            {
                _logger.LogError(exception, "Unhandled exception while processing {Method} {Path}.",
                    context.Request.Method, context.Request.Path);
            }
            else
            {
                _logger.LogWarning("Request {Method} {Path} failed with {StatusCode}: {Message}",
                    context.Request.Method, context.Request.Path, statusCode, message);
            }

            if (statusCode == StatusCodes.Status500InternalServerError && _environment.IsDevelopment())
            {
                message = exception.Message;
            }

            context.Response.Clear();
            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/json";

            var payload = ApiResponseDto<object>.Fail(message, errors);

            await context.Response.WriteAsync(JsonSerializer.Serialize(payload, SerializerOptions));
        }

        private static (int StatusCode, string Message, Dictionary<string, string[]>? Errors) Translate(Exception exception)
        {
            return exception switch
            {
                BadRequestException badRequest => (badRequest.StatusCode, badRequest.Message, badRequest.Errors),
                AppException appException => (appException.StatusCode, appException.Message, null),
                UnauthorizedAccessException => (StatusCodes.Status401Unauthorized, "You are not authenticated.", null),
                KeyNotFoundException => (StatusCodes.Status404NotFound, "The requested resource was not found.", null),
                DbUpdateConcurrencyException => (StatusCodes.Status409Conflict,
                    "The record was modified by someone else. Please retry.", null),
                DbUpdateException => (StatusCodes.Status409Conflict,
                    "The operation conflicts with existing data.", null),
                OperationCanceledException => (ClientClosedRequest, "The request was cancelled.", null),
                _ => (StatusCodes.Status500InternalServerError,
                    "An unexpected error occurred. Please try again later.", null)
            };
        }
    }

    public static class ExceptionMiddlewareExtensions
    {
        public static IApplicationBuilder UseExceptionMiddleware(this IApplicationBuilder app)
        {
            return app.UseMiddleware<ExceptionMiddleware>();
        }
    }
}
