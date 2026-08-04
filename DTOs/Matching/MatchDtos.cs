namespace Smart_team_project.DTOs.Matching
{
    public class MatchResultDto
    {
        public int TotalScore { get; set; }
        public int SkillsScore { get; set; }
        public int ExperienceScore { get; set; }
        public int EducationScore { get; set; }
        public int LocationScore { get; set; }
        public List<string> MatchedSkills { get; set; } = new();
        public List<string> MissingSkills { get; set; } = new();
    }

    public class MatchBreakdownDto
    {
        public int TotalScore { get; set; }
        public int SkillsScore { get; set; }
        public int ExperienceScore { get; set; }
        public int EducationScore { get; set; }
        public int LocationScore { get; set; }
        public List<string> MatchedSkills { get; set; } = new();
        public List<string> MissingSkills { get; set; } = new();
    }
}
