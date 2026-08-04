using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_team_project.Models.Entities;
using Smart_team_project.Models.Enums;

namespace Smart_team_project.Data.Configurations
{
    public class VacancyConfiguration : IEntityTypeConfiguration<Vacancy>
    {
        public void Configure(EntityTypeBuilder<Vacancy> builder)
        {
            builder.ToTable("Vacancies");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.Title).IsRequired().HasMaxLength(200);
            builder.Property(x => x.Description).IsRequired().HasMaxLength(5000);
            builder.Property(x => x.Location).IsRequired().HasMaxLength(150);
            builder.Property(x => x.RequiredExperience).IsRequired();
            builder.Property(x => x.EducationRequirement).IsRequired().HasMaxLength(200);
            builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(50).IsRequired();
            builder.Property(x => x.CreatedAt).IsRequired();
            builder.Property(x => x.UpdatedAt).IsRequired();

            builder.HasOne(x => x.Employer)
                .WithMany(x => x.Vacancies)
                .HasForeignKey(x => x.EmployerId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
