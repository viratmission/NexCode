using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_team_project.Models.Entities;

namespace Smart_team_project.Data.Configurations
{
    public class VacancySkillConfiguration : IEntityTypeConfiguration<VacancySkill>
    {
        public void Configure(EntityTypeBuilder<VacancySkill> builder)
        {
            builder.ToTable("VacancySkills");
            builder.HasKey(x => new { x.VacancyId, x.SkillId });

            builder.HasOne(x => x.Vacancy)
                .WithMany(x => x.VacancySkills)
                .HasForeignKey(x => x.VacancyId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.Skill)
                .WithMany(x => x.VacancySkills)
                .HasForeignKey(x => x.SkillId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
