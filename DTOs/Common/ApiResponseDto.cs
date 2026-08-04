namespace Smart_team_project.DTOs.Common
{
    public class ApiResponseDto<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
        public Dictionary<string, string[]>? Errors { get; set; }

        public static ApiResponseDto<T> Ok(T data, string message = "Success.")
            => new() { Success = true, Message = message, Data = data };

        public static ApiResponseDto<T> Ok(string message)
            => new() { Success = true, Message = message };

        public static ApiResponseDto<T> Fail(string message, Dictionary<string, string[]>? errors = null)
            => new() { Success = false, Message = message, Errors = errors };
    }

    public class ApiResponseDto : ApiResponseDto<object>
    {
    }
}
