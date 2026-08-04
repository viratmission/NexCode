namespace Smart_team_project.Exceptions
{
    public abstract class AppException : Exception
    {
        protected AppException(string message) : base(message)
        {
        }

        public abstract int StatusCode { get; }
    }

    public class NotFoundException : AppException
    {
        public NotFoundException(string message = "The requested resource was not found.") : base(message)
        {
        }

        public override int StatusCode => StatusCodes.Status404NotFound;
    }

    public class ConflictException : AppException
    {
        public ConflictException(string message = "The request conflicts with the current state.") : base(message)
        {
        }

        public override int StatusCode => StatusCodes.Status409Conflict;
    }

    public class ForbiddenException : AppException
    {
        public ForbiddenException(string message = "You are not allowed to perform this action.") : base(message)
        {
        }

        public override int StatusCode => StatusCodes.Status403Forbidden;
    }

    public class UnauthorizedException : AppException
    {
        public UnauthorizedException(string message = "Authentication failed.") : base(message)
        {
        }

        public override int StatusCode => StatusCodes.Status401Unauthorized;
    }

    public class BadRequestException : AppException
    {
        public BadRequestException(string message, Dictionary<string, string[]>? errors = null) : base(message)
        {
            Errors = errors;
        }

        public Dictionary<string, string[]>? Errors { get; }

        public override int StatusCode => StatusCodes.Status400BadRequest;
    }
}
