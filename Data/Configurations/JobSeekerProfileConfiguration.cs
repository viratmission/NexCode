using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_team_project.Models.Entities;

namespace Smart_team_project.Data.Configurations
{
    public class JobSeekerProfileConfiguration : IEntityTypeConfiguration<JobSeekerProfile>
    {
        public void Configure(EntityTypeBuilder<JobSeekerProfile> builder)
        {
            builder.ToTable("JobSeekerProfiles");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.ProfessionalTitle).IsRequired().HasMaxLength(200);
            builder.Property(x => x.Location).IsRequired().HasMaxLength(150);
            builder.Property(x => x.YearsOfExperience).IsRequired();
            builder.Property(x => x.Education).IsRequired().HasMaxLength(200);
            builder.Property(x => x.About).IsRequired().HasMaxLength(2000);
            builder.Property(x => x.CreatedAt).IsRequired();
            builder.Property(x => x.UpdatedAt).IsRequired();

            builder.HasIndex(x => x.UserId).IsUnique();

            builder.HasOne(x => x.CvDocument)
                .WithOne(x => x.JobSeekerProfile)
                .HasForeignKey<CvDocument>(x => x.JobSeekerId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
