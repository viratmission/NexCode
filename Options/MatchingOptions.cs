namespace Smart_team_project.Options
{
    public class MatchingOptions
    {
        public const string SectionName = "Matching";

        public int SkillsWeight { get; set; } = 60;
        public int ExperienceWeight { get; set; } = 20;
        public int EducationWeight { get; set; } = 10;
        public int LocationWeight { get; set; } = 10;

        public void Validate()
        {
            var total = SkillsWeight + ExperienceWeight + EducationWeight + LocationWeight;
            if (total != 100)
            {
                throw new InvalidOperationException(
                    $"Matching weights must total 100. Current total is {total}.");
            }
        }
    }
}
