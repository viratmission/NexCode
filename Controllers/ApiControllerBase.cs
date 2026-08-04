using Microsoft.AspNetCore.Mvc;
using Smart_team_project.Helpers;

namespace Smart_team_project.Controllers
{
    [ApiController]
    [Produces("application/json")]
    public abstract class ApiControllerBase : ControllerBase
    {
        protected int CurrentUserId => User.GetUserId();

        protected int? CurrentJobSeekerUserId =>
            User.Identity?.IsAuthenticated == true && User.IsInRole(RoleNames.JobSeeker)
                ? User.GetUserId()
                : null;
    }
}
