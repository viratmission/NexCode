using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_team_project.Models.Entities;

namespace Smart_team_project.Data.Configurations
{
    public class JobApplicationConfiguration : IEntityTypeConfiguration<JobApplication>
    {
        public void Configure(EntityTypeBuilder<JobApplication> builder)
        {
            builder.ToTable("JobApplications");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.MatchScore).IsRequired();
            builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(50).IsRequired();
            builder.Property(x => x.AppliedAt).IsRequired();
            builder.Property(x => x.UpdatedAt).IsRequired();

            builder.HasIndex(x => new { x.VacancyId, x.JobSeekerId }).IsUnique();

            builder.HasOne(x => x.Vacancy)
                .WithMany(x => x.JobApplications)
                .HasForeignKey(x => x.VacancyId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(x => x.JobSeeker)
                .WithMany(x => x.Applications)
                .HasForeignKey(x => x.JobSeekerId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
