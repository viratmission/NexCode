using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Smart_team_project.Models.Entities;

namespace Smart_team_project.Data.Configurations
{
    public class EmployerProfileConfiguration : IEntityTypeConfiguration<EmployerProfile>
    {
        public void Configure(EntityTypeBuilder<EmployerProfile> builder)
        {
            builder.ToTable("EmployerProfiles");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.CompanyName).IsRequired().HasMaxLength(200);
            builder.Property(x => x.Industry).IsRequired().HasMaxLength(150);
            builder.Property(x => x.Location).IsRequired().HasMaxLength(150);
            builder.Property(x => x.Description).IsRequired().HasMaxLength(2000);
            builder.Property(x => x.CreatedAt).IsRequired();
            builder.Property(x => x.UpdatedAt).IsRequired();

            builder.HasIndex(x => x.UserId).IsUnique();
        }
    }
}
