namespace Smart_team_project.Models.Entities
{
    public class JobSeekerProfile
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string ProfessionalTitle { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public int YearsOfExperience { get; set; }
        public string Education { get; set; } = string.Empty;
        public string About { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public User User { get; set; } = null!;
        public ICollection<JobSeekerSkill> JobSeekerSkills { get; set; } = new List<JobSeekerSkill>();
        public ICollection<JobApplication> JobApplications { get; set; } = new List<JobApplication>();
        public CvDocument? CvDocument { get; set; }
    }
}
