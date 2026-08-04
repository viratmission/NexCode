using Microsoft.EntityFrameworkCore;
using Smart_team_project.Data;
using Smart_team_project.Models.Entities;

namespace Smart_team_project.Repositories
{
    internal static class SkillCatalog
    {
        public static async Task<List<Skill>> EnsureAsync(
            AppDbContext context,
            IEnumerable<string> skillNames,
            CancellationToken cancellationToken)
        {
            var requested = skillNames
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .Select(name => name.Trim())
                .GroupBy(name => name, StringComparer.OrdinalIgnoreCase)
                .Select(group => group.First())
                .ToList();

            if (requested.Count == 0)
            {
                return new List<Skill>();
            }

            var lowered = requested.Select(name => name.ToLower()).ToList();

            var existing = await context.Skills
                .Where(skill => lowered.Contains(skill.Name.ToLower()))
                .ToListAsync(cancellationToken);

            var result = new List<Skill>(existing);

            foreach (var name in requested)
            {
                if (existing.Any(skill => string.Equals(skill.Name, name, StringComparison.OrdinalIgnoreCase)))
                {
                    continue;
                }

                var created = new Skill { Name = name };
                await context.Skills.AddAsync(created, cancellationToken);
                result.Add(created);
            }

            return result;
        }
    }
}
