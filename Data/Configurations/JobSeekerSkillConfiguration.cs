using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_team_project.Models.Entities;

namespace Smart_team_project.Data.Configurations
{
    public class JobSeekerSkillConfiguration : IEntityTypeConfiguration<JobSeekerSkill>
    {
        public void Configure(EntityTypeBuilder<JobSeekerSkill> builder)
        {
            builder.ToTable("JobSeekerSkills");
            builder.HasKey(x => new { x.JobSeekerProfileId, x.SkillId });

            builder.HasOne(x => x.JobSeekerProfile)
                .WithMany(x => x.JobSeekerSkills)
                .HasForeignKey(x => x.JobSeekerProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.Skill)
                .WithMany(x => x.JobSeekerSkills)
                .HasForeignKey(x => x.SkillId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
